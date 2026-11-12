import { Injectable } from '@nestjs/common';
import { ReturnRequest } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';

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

  async findAll(): Promise<ReturnRequest[]> {
    return this.prisma.returnRequest.findMany({
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
        status: dados.status.getValue(),
        trackingCode: dados.trackingCode ?? null,
        inspectionResult: dados.inspectionResult ?? null,
        rejectionReason: dados.rejectionReason ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.returnRequest.delete({ where: { id } });
  }
}
