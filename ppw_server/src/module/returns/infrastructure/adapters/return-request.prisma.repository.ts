import { Injectable } from '@nestjs/common';
import { ReturnRequest } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { VersionConflictError } from '../../domain/errors';

@Injectable()
export class ReturnRequestPrismaRepository implements ReturnRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(solicitacao: ReturnRequestEntity): Promise<ReturnRequest> {
    const { id, orderId, customerId, productId, type, reason, description, trackingCode } = solicitacao.props;
    return this.prisma.returnRequest.create({
      data: { id, orderId, customerId, productId, type, reason, description, trackingCode: trackingCode ?? null },
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
  ): Promise<ReturnRequest> {
    const data = request.props;
    const result = await this.prisma.returnRequest.updateMany({
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

    const updated = await this.prisma.returnRequest.findUnique({ where: { id: data.id } });
    if (!updated) throw new Error('Return request disappeared after a successful update');
    return updated;
  }
}
