import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TicketReadRepository } from '../../../domain/ports/ticket.read.repository';
import { TicketWriteRepository } from '../../../domain/ports/ticket.write.repository';
import { DeleteTicketUseCase } from '../../use-case/write/delete.ticket.usecase';

@Injectable()
export class DeleteTicketService implements DeleteTicketUseCase {
  constructor(
    @Inject('TICKET_READ_REPOSITORY')
    private readonly ticketReadRepository: TicketReadRepository,
    @Inject('TICKET_WRITE_REPOSITORY')
    private readonly ticketWriteRepository: TicketWriteRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.ticketReadRepository.findTicketById(id);
    if (!existing) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    await this.ticketWriteRepository.deleteTicket(id);
  }
}
