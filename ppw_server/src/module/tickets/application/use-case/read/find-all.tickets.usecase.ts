import { TicketResponse } from '../../dto/ticket.response';

export const FIND_ALL_TICKETS_USECASE = 'FIND_ALL_TICKETS_USECASE';

export interface FindAllTicketsUseCase {
  execute(): Promise<TicketResponse[]>;
}
