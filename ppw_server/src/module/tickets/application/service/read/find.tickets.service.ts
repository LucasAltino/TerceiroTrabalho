import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TicketReadRepository } from '../../../domain/ports/ticket.read.repository';
import { TicketResponse } from '../../dto/ticket.response';
import { TicketMapper } from '../../mapper/ticket.mapper';
import { FindAllTicketsUseCase } from '../../use-case/read/find-all.tickets.usecase';
import { FindTicketByIdUseCase } from '../../use-case/read/find-by-id.ticket.usecase';

@Injectable()
export class FindTicketsService implements FindAllTicketsUseCase, FindTicketByIdUseCase {
  constructor(
    @Inject('TICKET_READ_REPOSITORY')
    private readonly ticketReadRepository: TicketReadRepository,
  ) {}

  async execute(id?: string): Promise<any> {
    if (id !== undefined) {
      const ticket = await this.ticketReadRepository.findTicketById(id);
      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${id} not found`);
      }
      return TicketMapper.toResponse(ticket);
    }

    const tickets = await this.ticketReadRepository.findTicketAll();
    return tickets.map((t) => TicketMapper.toResponse(t));
  }
}
