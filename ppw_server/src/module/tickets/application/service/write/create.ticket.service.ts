import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TicketEntity } from '../../../domain/entity/ticket.entity';
import { TicketWriteRepository } from '../../../domain/ports/ticket.write.repository';
import { Priority } from '../../../domain/value-object/priority.value.object';
import { Status } from '../../../domain/value-object/status.value.object';
import { TicketRequest } from '../../dto/ticket.request';
import { TicketResponse } from '../../dto/ticket.response';
import { TicketMapper } from '../../mapper/ticket.mapper';
import { CreateTicketUseCase } from '../../use-case/write/create.ticket.usecase';

@Injectable()
export class CreateTicketService implements CreateTicketUseCase {
  constructor(
    @Inject('TICKET_WRITE_REPOSITORY')
    private readonly ticketRepository: TicketWriteRepository,
  ) {}

  async execute(ticket: TicketRequest): Promise<TicketResponse> {
    const id = ticket.id ?? randomUUID();
    const normalizedTicket = {
      ...ticket,
      id,
      title: ticket.title?.trim() ?? '',
      description: ticket.description?.trim() ?? '',
      justify: ticket.justify ?? null,
      priority: ticket.priority ?? 'MEDIUM',
      status: ticket.status ?? 'open',
    };

    const entity = new TicketEntity({
      id: normalizedTicket.id,
      title: normalizedTicket.title,
      description: normalizedTicket.description,
      justify: normalizedTicket.justify,
      priority: Priority.from(normalizedTicket.priority),
      status: Status.from(normalizedTicket.status),
      createdAt: new Date(),
      updatedAt: null,
      deletedAt: null,
    });

    const created = await this.ticketRepository.createTicket(entity);
    return TicketMapper.toResponse(created);
  }
}
