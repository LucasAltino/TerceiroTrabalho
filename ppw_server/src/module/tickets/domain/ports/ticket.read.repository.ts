import { Ticket } from '@prisma/client';

export interface TicketReadRepository {
  findTicketAll(): Promise<Ticket[]>;
  findTicketById(id: string): Promise<Ticket | null>;
}
