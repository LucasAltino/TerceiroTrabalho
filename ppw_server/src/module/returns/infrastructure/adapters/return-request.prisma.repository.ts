import { Inject, Injectable } from '@nestjs/common';
import { Prisma, RefundStatus, ReturnRequest, ReturnStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
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

  async create(solicitacao: ReturnRequestEntity, items: ReturnQuantity[]): Promise<ReturnRequest> {
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

      return transaction.returnRequest.create({
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
    });
  }

  async findById(id: string): Promise<ReturnRequest | null> {
    return this.prisma.returnRequest.findUnique({ where: { id } });
  }

  async findAll(customerId?: string): Promise<ReturnRequest[]> {
    return this.prisma.returnRequest.findMany({
      where: customerId ? { customerId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(solicitacao: ReturnRequestEntity): Promise<ReturnRequest> {
    const dados = solicitacao.props;
    return this.prisma.returnRequest.update({
      where: { id: dados.id },
      data: {
        reason: dados.reason,
        description: dados.description,
        trackingCode: dados.trackingCode ?? null,
      },
    });
  }

  async updateWithVersion(
    request: ReturnRequestEntity,
    expectedVersion: number,
    from: ReturnStatusValue[],
    previousStatus: ReturnStatusValue,
    actorId: string,
    justification: string,
  ): Promise<ReturnRequest> {
    const data = request.props;
    return this.prisma.$transaction(async (transaction) => {
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

      const updated = await transaction.returnRequest.findUnique({ where: { id: data.id } });
      if (!updated) throw new Error('Return request disappeared after a successful update');
      return updated;
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
