import { Module } from '@nestjs/common';
import { CreateTicketService } from './application/service/write/create.ticket.service';
import { FindTicketsService } from './application/service/read/find.tickets.service';
import { UpdateTicketService } from './application/service/write/update.ticket.service';
import { DeleteTicketService } from './application/service/write/delete.ticket.service';
import { TicketPrismaReadRepository } from './infrastructure/adapters/ticket.prisma.read.repository';
import { TicketPrismaWriteRepository } from './infrastructure/adapters/ticket.prisma.write.repository';
import { TicketsController } from './presentation/create.ticket.controller';

const ticketProviders = [
  TicketPrismaWriteRepository,
  {
    provide: 'TICKET_WRITE_REPOSITORY',
    useClass: TicketPrismaWriteRepository,
  },
  TicketPrismaReadRepository,
  {
    provide: 'TICKET_READ_REPOSITORY',
    useClass: TicketPrismaReadRepository,
  },
  CreateTicketService,
  {
    provide: 'CREATE_TICKET_USECASE',
    useClass: CreateTicketService,
  },
  FindTicketsService,
  {
    provide: 'FIND_ALL_TICKETS_USECASE',
    useClass: FindTicketsService,
  },
  {
    provide: 'FIND_BY_ID_TICKET_USECASE',
    useClass: FindTicketsService,
  },
  UpdateTicketService,
  {
    provide: 'UPDATE_TICKET_USECASE',
    useClass: UpdateTicketService,
  },
  {
    provide: 'UPDATE_TICKET_STATUS_USECASE',
    useClass: UpdateTicketService,
  },
  DeleteTicketService,
  {
    provide: 'DELETE_TICKET_USECASE',
    useClass: DeleteTicketService,
  },
];

@Module({
  controllers: [TicketsController],
  providers: ticketProviders,
  exports: ['CREATE_TICKET_USECASE', 'FIND_ALL_TICKETS_USECASE', 'UPDATE_TICKET_USECASE', 'DELETE_TICKET_USECASE'],
})
export class TicketsModule {}
