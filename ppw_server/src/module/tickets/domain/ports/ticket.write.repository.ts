import { Ticket } from '@prisma/client';
import { TicketEntity } from '../entity/ticket.entity';

export interface TicketWriteRepository {
  createTicket(ticket: TicketEntity): Promise<Ticket>;
  updateTicket(ticket: TicketEntity): Promise<Ticket>;
  updateTicketStatus(id: string, status: string): Promise<void>;
  deleteTicket(id: string): Promise<void>;
}
