import { Ticket } from '@prisma/client';
import { TicketResponse } from '../../dto/ticket.response';
import { TicketRequest } from '../../dto/ticket.request';

export const CREATE_TICKET_USECASE = 'CREATE_TICKET_USECASE';

export interface CreateTicketUseCase {
  execute(ticket: TicketRequest): Promise<TicketResponse>;
}
