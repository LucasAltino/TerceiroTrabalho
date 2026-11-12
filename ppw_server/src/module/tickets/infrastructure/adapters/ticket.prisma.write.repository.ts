import { Injectable } from '@nestjs/common';
import { Ticket } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { TicketEntity } from '../../domain/entity/ticket.entity';
import { TicketWriteRepository } from '../../domain/ports/ticket.write.repository';
import { NivelPriority } from '../../domain/value-object/priority.value.object';
import { TicketStatus } from '../../domain/value-object/status.value.object';

@Injectable()
export class TicketPrismaWriteRepository implements TicketWriteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(ticket: TicketEntity): Promise<Ticket> {
    const { id, title, description, justify, priority, status } = ticket.props;

    return this.prisma.ticket.create({
      data: {
        id,
        title,
        description,
        justify: justify ?? null,
        prioridade: this.mapPriorityToPrisma(priority.getValue()),
        status: this.mapStatusToPrisma(status.getValue()),
      },
    });
  }

  async updateTicket(ticket: TicketEntity): Promise<Ticket> {
    const { id, title, description, justify, priority, status } = ticket.props;

    return this.prisma.ticket.update({
      where: { id },
      data: {
        title,
        description,
        justify: justify ?? null,
        prioridade: this.mapPriorityToPrisma(priority.getValue()),
        status: this.mapStatusToPrisma(status.getValue()),
      },
    });
  }

  async updateTicketStatus(id: string, status: string): Promise<void> {
    await this.prisma.ticket.update({
      where: { id },
      data: {
        status: this.mapStatusToPrismaFromString(status),
      },
    });
  }

  async deleteTicket(id: string): Promise<void> {
    await this.prisma.ticket.delete({ where: { id } });
  }

  private mapPriorityToPrisma(priority: NivelPriority): 'ALTA' | 'MEDIA' | 'BAIXA' {
    switch (priority) {
      case NivelPriority.HIGH:
        return 'ALTA';
      case NivelPriority.MEDIUM:
        return 'MEDIA';
      case NivelPriority.LOW:
      default:
        return 'BAIXA';
    }
  }

  private mapStatusToPrisma(status: TicketStatus): 'ABERTO' | 'CONCLUIDO' {
    switch (status) {
      case TicketStatus.CLOSED:
        return 'CONCLUIDO';
      case TicketStatus.OPEN:
      default:
        return 'ABERTO';
    }
  }

  private mapStatusToPrismaFromString(status: string): 'ABERTO' | 'CONCLUIDO' {
    const normalized = status.trim().toLowerCase();

    switch (normalized) {
      case 'closed':
      case 'concluido':
      case 'concluida':
        return 'CONCLUIDO';
      case 'open':
      case 'aberto':
      default:
        return 'ABERTO';
    }
  }
}
