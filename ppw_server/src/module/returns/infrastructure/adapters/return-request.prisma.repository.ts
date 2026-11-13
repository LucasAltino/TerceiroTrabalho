import { Inject, Injectable } from '@nestjs/common';
import { Prisma, RefundStatus, ReturnRequest, ReturnStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity, ReturnRequestRecord } from '../../domain/entity/return-request.entity';
import { CreatedReturnRequest, ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { PayloadValidationError, VersionConflictError } from '../../domain/errors';
import { ReturnQuantity, RefundCalculationInput, RefundStrategy } from '../../domain/refund/refund-strategy';
import { calculateReturnRefund } from '../../domain/refund/calculate-return-refund';

@Injectable()
export class ReturnRequestPrismaRepository implements ReturnRequestRepository {
  constructor(
    private readonly prisma: PrismaService,
    @Inject('REFUND_STRATEGY') private readonly refundStrategy: RefundStrategy,
  ) {}

  async create(solicitacao: ReturnRequestEntity, items: ReturnQuantity[]): Promise<CreatedReturnRequest> {
    const { id, orderId, customerId, productId, type, reason, description, trackingCode } = solicitacao.props;
    return this.prisma.$transaction(async (transaction) => {
      const order = await transaction.order.findUnique({
        where: { id: orderId },
        include: { items: { include: { returnItems: { include: { returnRequest: true } } } } },
      });
      if (!order) throw new PayloadValidationError('Order was not found');

      const requestedIds = new Set(items.map((item) => item.orderItemId));
      if (requestedIds.size !== items.length) {
        throw new PayloadValidationError('An order item may only appear once per return');
      }

      for (const requestedItem of items) {
        const orderItem = order.items.find((item) => item.id === requestedItem.orderItemId);
        if (!orderItem) throw new PayloadValidationError('Return item does not belong to this order');
        const activeReturnedQuantity = orderItem.returnItems
          .filter(
            (returnItem) =>
              returnItem.returnRequest.status !== ReturnStatus.CANCELLED &&
              returnItem.returnRequest.status !== ReturnStatus.REJECTED,
          )
          .reduce((sum, returnItem) => sum + returnItem.quantity, 0);
        if (activeReturnedQuantity + requestedItem.quantity > orderItem.quantity) {
          throw new PayloadValidationError('Return quantity exceeds the order item quantity');
        }
      }

      const request = await transaction.returnRequest.create({
        data: {
          id,
          orderId,
          customerId,
          productId,
          type,
          reason,
          description,
          trackingCode: trackingCode ?? null,
          items: {
            create: items.map((item) => ({
              quantity: item.quantity,
              orderItem: { connect: { id: item.orderItemId } },
            })),
          },
        },
      });
      const reverseCode = randomBytes(32).toString('base64url');
      await transaction.reverseCode.create({
        data: {
          code: reverseCode,
          returnRequestId: id,
          orderId,
          expiresAt: this.reverseCodeExpiry(),
        },
      });
      return { request: toRecord(request), reverseCode };
    });
  }

  async findById(id: string): Promise<ReturnRequestRecord | null> {
    const request = await this.prisma.returnRequest.findUnique({ where: { id } });
    return request ? toRecord(request) : null;
  }

  async findAll(customerId?: string): Promise<ReturnRequestRecord[]> {
    const requests = await this.prisma.returnRequest.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(toRecord);
  }

  async update(solicitacao: ReturnRequestEntity): Promise<ReturnRequestRecord> {
    const dados = solicitacao.props;
    const updated = await this.prisma.returnRequest.update({
      where: { id: dados.id },
      data: {
        reason: dados.reason,
        description: dados.description,
        trackingCode: dados.trackingCode ?? null,
      },
    });
    return toRecord(updated);
  }

  async updateWithVersion(
    request: ReturnRequestEntity,
    expectedVersion: number,
    from: ReturnStatusValue[],
    previousStatus: ReturnStatusValue,
    actorId: string,
    justification: string,
    reverseCode?: string,
  ): Promise<ReturnRequestRecord> {
    const data = request.props;
    return this.prisma.$transaction(async (transaction) => {
      if (data.status.getValue() === ReturnStatusValue.POSTED) {
        if (!reverseCode) throw new PayloadValidationError('Reverse code is required to post a return');
        await this.useReverseCode(transaction, data.id, data.orderId, reverseCode);
      }

      const result = await transaction.returnRequest.updateMany({
        where: {
          id: data.id,
          version: expectedVersion,
          status: { in: from },
        },
        data: {
          status: data.status.getValue(),
          version: { increment: 1 },
          trackingCode: data.trackingCode ?? null,
          inspectionResult: data.inspectionResult ?? null,
          rejectionReason: data.rejectionReason ?? null,
          adjustmentRequestedAt: data.adjustmentRequestedAt ?? null,
          adjustmentReason: data.adjustmentReason ?? null,
          updatedAt: new Date(),
        },
      });

      if (result.count === 0) {
        throw new VersionConflictError('Return request was changed by another operation');
      }

      await transaction.returnStatusHistory.create({
        data: {
          returnRequestId: data.id,
          estadoAnterior: previousStatus,
          novoEstado: data.status.getValue(),
          autorId: actorId,
          justificativa: justification,
        },
      });

      if (data.status.getValue() === ReturnStatusValue.APPROVED && data.type === 'DEVOLUTION') {
        await this.createRefund(transaction, data.id, data.orderId);
      }
      if (data.status.getValue() === ReturnStatusValue.COMPLETED && data.type === 'DEVOLUTION') {
        const result = await transaction.refund.updateMany({
          where: { returnRequestId: data.id, status: RefundStatus.PENDING },
          data: { status: RefundStatus.PAID },
        });
        if (result.count !== 1) throw new Error('Pending refund was not found for the approved return');
      }
      if (data.status.getValue() === ReturnStatusValue.CANCELLED) {
        await this.cancelReturn(transaction, data.id, data.orderId, previousStatus, data.type);
      }

      const updated = await transaction.returnRequest.findUnique({ where: { id: data.id } });
      if (!updated) throw new Error('Return request disappeared after a successful update');
      return toRecord(updated);
    });
  }

  private async createRefund(
    transaction: Prisma.TransactionClient,
    returnRequestId: string,
    orderId: string,
  ): Promise<void> {
    const [order, currentRequest] = await Promise.all([
      transaction.order.findUnique({
        where: { id: orderId },
        include: {
          items: true,
          returns: {
            where: {
              id: { not: returnRequestId },
              status: { in: [ReturnStatus.APPROVED, ReturnStatus.COMPLETED] },
            },
            include: {
              items: true,
              refunds: {
                where: { status: { in: [RefundStatus.PENDING, RefundStatus.PAID] } },
              },
            },
          },
        },
      }),
      transaction.returnRequest.findUnique({
        where: { id: returnRequestId },
        include: { items: true },
      }),
    ]);

    if (!order || !currentRequest || currentRequest.items.length === 0) {
      throw new PayloadValidationError('Order and return items are required to calculate a refund');
    }

    const priorReturnItems = order.returns.flatMap((returnRequest) =>
      returnRequest.items.map((item) => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      })),
    );
    const alreadyRefundedCents = order.returns
      .flatMap((returnRequest) => returnRequest.refunds)
      .reduce((sum, refund) => sum + decimalToCents(refund.value), 0n);
    if (alreadyRefundedCents !== decimalToCents(order.amountRefunded)) {
      throw new Error('Order refund balance does not match active refund records');
    }
    const input: RefundCalculationInput = {
      itemsTotalCents: decimalToCents(order.itemsTotal),
      couponDiscountCents: decimalToCents(order.couponDiscount),
      shippingPaidCents: decimalToCents(order.shippingPaid),
      amountPaidCents: decimalToCents(order.amountPaid),
      amountAlreadyRefundedCents: alreadyRefundedCents,
      orderItems: order.items.map((item) => ({
        id: item.id,
        unitPriceCents: decimalToCents(item.unitPrice),
        quantity: item.quantity,
      })),
      previouslyReturnedItems: priorReturnItems,
      requestedItems: currentRequest.items.map((item) => ({
        orderItemId: item.orderItemId,
        quantity: item.quantity,
      })),
    };
    const amount = calculateReturnRefund('DEVOLUTION', this.refundStrategy, input);
    if (amount > 0n) {
      const updatedOrder = await transaction.order.updateMany({
        where: { id: order.id, amountRefunded: order.amountRefunded },
        data: { amountRefunded: { increment: centsToDecimal(amount) } },
      });
      if (updatedOrder.count === 0) {
        throw new VersionConflictError('Order refund balance was changed by another operation');
      }
    }
    await transaction.refund.create({
      data: {
        returnRequestId,
        value: centsToDecimal(amount),
        status: RefundStatus.PENDING,
      },
    });
  }

  private reverseCodeExpiry(): Date {
    const rawDays = process.env.RETURN_CODE_TTL_DAYS;
    const days = rawDays === undefined ? 7 : Number(rawDays);
    if (!Number.isSafeInteger(days) || days <= 0) {
      throw new Error('RETURN_CODE_TTL_DAYS must be a positive integer');
    }
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    if (!Number.isFinite(expiresAt.getTime())) {
      throw new Error('RETURN_CODE_TTL_DAYS is outside the supported date range');
    }
    return expiresAt;
  }

  private async useReverseCode(
    transaction: Prisma.TransactionClient,
    returnRequestId: string,
    orderId: string,
    code: string,
  ): Promise<void> {
    const reverseCode = await transaction.reverseCode.findUnique({ where: { code } });
    if (
      !reverseCode ||
      reverseCode.returnRequestId !== returnRequestId ||
      reverseCode.orderId !== orderId
    ) {
      throw new PayloadValidationError('Reverse code is invalid');
    }
    if (reverseCode.usedAt) {
      throw new VersionConflictError('Reverse code has already been used');
    }

    const now = new Date();
    if (reverseCode.expiresAt <= now) {
      throw new PayloadValidationError('Reverse code has expired');
    }
    const claimed = await transaction.reverseCode.updateMany({
      where: { id: reverseCode.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count === 0) {
      const latest = await transaction.reverseCode.findUnique({ where: { id: reverseCode.id } });
      if (latest?.usedAt) {
        throw new VersionConflictError('Reverse code has already been used');
      }
      throw new PayloadValidationError('Reverse code has expired or is invalid');
    }
  }

  private async cancelReturn(
    transaction: Prisma.TransactionClient,
    returnRequestId: string,
    orderId: string,
    previousStatus: ReturnStatusValue,
    returnType: string,
  ): Promise<void> {
    const now = new Date();
    await transaction.reverseCode.updateMany({
      where: { returnRequestId, expiresAt: { gt: now } },
      data: { expiresAt: now },
    });

    if (previousStatus !== ReturnStatusValue.APPROVED || returnType === 'EXCHANGE') return;

    const refund = await transaction.refund.findUnique({ where: { returnRequestId } });
    if (!refund || refund.status !== RefundStatus.PENDING) {
      throw new VersionConflictError('Only a pending refund can be reversed by cancellation');
    }

    const reversed = await transaction.refund.updateMany({
      where: { returnRequestId, status: RefundStatus.PENDING },
      data: { status: RefundStatus.REVERSED },
    });
    if (reversed.count !== 1) {
      throw new VersionConflictError('Refund was changed by another operation');
    }

    if (decimalToCents(refund.value) === 0n) return;
    const order = await transaction.order.findUnique({
      where: { id: orderId },
      select: { amountRefunded: true },
    });
    if (!order || decimalToCents(order.amountRefunded) < decimalToCents(refund.value)) {
      throw new Error('Order refund balance is inconsistent');
    }
    const released = await transaction.order.updateMany({
      where: { id: orderId, amountRefunded: order.amountRefunded },
      data: { amountRefunded: { decrement: refund.value } },
    });
    if (released.count !== 1) {
      throw new VersionConflictError('Order refund balance was changed by another operation');
    }
  }
}

function toRecord(request: ReturnRequest): ReturnRequestRecord {
  return {
    id: request.id,
    orderId: request.orderId,
    customerId: request.customerId,
    productId: request.productId,
    type: request.type === 'EXCHANGE' ? 'EXCHANGE' : 'DEVOLUTION',
    reason: request.reason,
    description: request.description,
    status: request.status,
    trackingCode: request.trackingCode,
    inspectionResult: request.inspectionResult,
    rejectionReason: request.rejectionReason,
    adjustmentRequestedAt: request.adjustmentRequestedAt,
    adjustmentReason: request.adjustmentReason,
    version: request.version,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
  };
}

function decimalToCents(value: Prisma.Decimal): bigint {
  const formatted = value.toFixed(2);
  const negative = formatted.startsWith('-');
  const [whole, fraction = '00'] = (negative ? formatted.slice(1) : formatted).split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0').slice(0, 2));
  return negative ? -cents : cents;
}

function centsToDecimal(cents: bigint): Prisma.Decimal {
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const formatted = `${absolute / 100n}.${(absolute % 100n).toString().padStart(2, '0')}`;
  return new Prisma.Decimal(negative ? `-${formatted}` : formatted);
}
