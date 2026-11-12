import { Ticket } from '@prisma/client';
import { TicketEntity } from '../../domain/entity/ticket.entity';
import { Priority } from '../../domain/value-object/priority.value.object';
import { Status } from '../../domain/value-object/status.value.object';
import { TicketResponse, TicketPriorityResponse, TicketStatusResponse } from '../dto/ticket.response';

export class TicketMapper {
  static toResponse(ticket: Ticket | TicketEntity): TicketResponse {
    if (ticket instanceof TicketEntity) {
      const props = ticket.props;
      return {
        id: props.id,
        title: props.title,
        description: props.description,
        justify: props.justify ?? null,
        priority: this.toPriorityResponse(props.priority.getValue()),
        status: this.toStatusResponse(props.status.getValue()),
        createdAt: props.createdAt ?? null,
        updatedAt: props.updatedAt ?? null,
        deletedAt: props.deletedAt ?? null,
      };
    }

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      justify: ticket.justify ?? null,
      priority: this.mapPrismaPriorityToResponse(ticket.prioridade),
      status: this.mapPrismaStatusToResponse(ticket.status),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      deletedAt: ticket.deletedAt,
    };
  }

  static toEntity(ticket: Ticket): TicketEntity {
    return new TicketEntity({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      justify: ticket.justify,
      priority: Priority.from(ticket.prioridade),
      status: Status.from(ticket.status),
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      deletedAt: ticket.deletedAt,
    });
  }

  private static mapPrismaPriorityToResponse(priority: string): TicketPriorityResponse {
    switch (priority) {
      case 'ALTA':
        return 'HIGH';
      case 'BAIXA':
        return 'LOW';
      case 'MEDIA':
      default:
        return 'MEDIUM';
    }
  }

  private static mapPrismaStatusToResponse(status: string): TicketStatusResponse {
    switch (status) {
      case 'CONCLUIDO':
        return 'closed';
      case 'ABERTO':
      default:
        return 'open';
    }
  }

  private static toPriorityResponse(priority: string): TicketPriorityResponse {
    const norm = priority.toUpperCase();
    if (norm === 'HIGH' || norm === 'ALTA') return 'HIGH';
    if (norm === 'LOW' || norm === 'BAIXA') return 'LOW';
    return 'MEDIUM';
  }

  private static toStatusResponse(status: string): TicketStatusResponse {
    const norm = status.toLowerCase();
    if (norm === 'closed' || norm === 'concluido') return 'closed';
    if (norm === 'in_progress') return 'in_progress';
    return 'open';
  }
}
