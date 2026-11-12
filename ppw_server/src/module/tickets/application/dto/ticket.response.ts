export type TicketPriorityResponse = 'LOW' | 'MEDIUM' | 'HIGH';
export type TicketStatusResponse = 'open' | 'in_progress' | 'closed';

export class TicketResponse {
  id?: string;
  title!: string;
  description!: string;
  justify?: string | null;
  priority!: TicketPriorityResponse;
  status!: TicketStatusResponse;
  createdAt?: Date | null;
  updatedAt?: Date | null;
  deletedAt?: Date | null;
}
