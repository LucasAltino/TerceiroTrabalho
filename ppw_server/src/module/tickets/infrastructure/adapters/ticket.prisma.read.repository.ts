import { Injectable } from '@nestjs/common';
import { Ticket } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketReadRepository } from '../../domain/ports/ticket.read.repository';

@Injectable()
export class TicketPrismaReadRepository implements TicketReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTicketAll(): Promise<Ticket[]> {
    return this.prisma.ticket.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTicketById(id: string): Promise<Ticket | null> {
    return this.prisma.ticket.findUnique({ where: { id } });
  }
}
