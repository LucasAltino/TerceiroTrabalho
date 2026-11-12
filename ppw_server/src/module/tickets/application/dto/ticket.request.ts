import { Ticketprops } from '../../domain/entity/ticket.entity';

export type TicketPriorityInput = 'LOW' | 'MEDIUM' | 'HIGH' | 'low' | 'medium' | 'high';
export type TicketStatusInput =
  | 'open'
  | 'in_progress'
  | 'closed'
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'CLOSED'
  | 'ABERTO'
  | 'CONCLUIDO';

export class TicketRequest {
  id?: string;
  title!: string;
  description!: string;
  justify?: string | null;
  priority!: TicketPriorityInput;
  status?: TicketStatusInput;

  constructor(props: Partial<Ticketprops> & { priority?: TicketPriorityInput; status?: TicketStatusInput }) {
    Object.assign(this, props);
  }
}

export class UpdateTicketRequest {
  title?: string;
  description?: string;
  justify?: string | null;
  priority?: TicketPriorityInput;
  status?: TicketStatusInput;
}

export class UpdateTicketStatusRequest {
  status!: TicketStatusInput;
}
