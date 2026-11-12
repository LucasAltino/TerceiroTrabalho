import { UpdateTicketRequest, UpdateTicketStatusRequest } from '../../dto/ticket.request';
import { TicketResponse } from '../../dto/ticket.response';

export const UPDATE_TICKET_USECASE = 'UPDATE_TICKET_USECASE';
export const UPDATE_TICKET_STATUS_USECASE = 'UPDATE_TICKET_STATUS_USECASE';

export interface UpdateTicketUseCase {
  execute(id: string, request: UpdateTicketRequest): Promise<TicketResponse>;
}

export interface UpdateTicketStatusUseCase {
  execute(id: string, request: UpdateTicketStatusRequest): Promise<TicketResponse>;
}
