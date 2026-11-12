import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TicketReadRepository } from '../../../domain/ports/ticket.read.repository';
import { TicketWriteRepository } from '../../../domain/ports/ticket.write.repository';
import { Priority } from '../../../domain/value-object/priority.value.object';
import { Status } from '../../../domain/value-object/status.value.object';
import { UpdateTicketRequest, UpdateTicketStatusRequest } from '../../dto/ticket.request';
import { TicketResponse } from '../../dto/ticket.response';
import { TicketMapper } from '../../mapper/ticket.mapper';
import { UpdateTicketStatusUseCase, UpdateTicketUseCase } from '../../use-case/write/update.ticket.usecase';

@Injectable()
export class UpdateTicketService implements UpdateTicketUseCase, UpdateTicketStatusUseCase {
  constructor(
    @Inject('TICKET_READ_REPOSITORY')
    private readonly ticketReadRepository: TicketReadRepository,
    @Inject('TICKET_WRITE_REPOSITORY')
    private readonly ticketWriteRepository: TicketWriteRepository,
  ) {}

  async execute(id: string, request: UpdateTicketRequest | UpdateTicketStatusRequest): Promise<TicketResponse> {
    const existing = await this.ticketReadRepository.findTicketById(id);
    if (!existing) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    const entity = TicketMapper.toEntity(existing);

    let updatedEntity = entity;

    if ('title' in request || 'description' in request || 'priority' in request || 'justify' in request) {
      const fullReq = request as UpdateTicketRequest;
      updatedEntity = updatedEntity.update({
        title: fullReq.title,
        description: fullReq.description,
        justify: fullReq.justify,
        priority: fullReq.priority ? Priority.from(fullReq.priority) : undefined,
      });
    }

    if (request.status) {
      updatedEntity = updatedEntity.changeStatus(Status.from(request.status));
    }

    const updated = await this.ticketWriteRepository.updateTicket(updatedEntity);
    return TicketMapper.toResponse(updated);
  }
}
