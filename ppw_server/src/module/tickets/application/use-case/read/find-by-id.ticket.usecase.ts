import { TicketResponse } from '../../dto/ticket.response';

export const FIND_BY_ID_TICKET_USECASE = 'FIND_BY_ID_TICKET_USECASE';

export interface FindTicketByIdUseCase {
  execute(id: string): Promise<TicketResponse | null>;
}
