import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Inject, Param, Patch, Post, Put } from '@nestjs/common';
import { TicketRequest, UpdateTicketRequest, UpdateTicketStatusRequest } from '../application/dto/ticket.request';
import { TicketResponse } from '../application/dto/ticket.response';
import { CreateTicketUseCase } from '../application/use-case/write/create.ticket.usecase';
import { FindAllTicketsUseCase } from '../application/use-case/read/find-all.tickets.usecase';
import { FindTicketByIdUseCase } from '../application/use-case/read/find-by-id.ticket.usecase';
import { UpdateTicketStatusUseCase, UpdateTicketUseCase } from '../application/use-case/write/update.ticket.usecase';
import { DeleteTicketUseCase } from '../application/use-case/write/delete.ticket.usecase';

@Controller('tickets')
export class TicketsController {
  constructor(
    @Inject('CREATE_TICKET_USECASE')
    private readonly createTicketUseCase: CreateTicketUseCase,
    @Inject('FIND_ALL_TICKETS_USECASE')
    private readonly findAllTicketsUseCase: FindAllTicketsUseCase,
    @Inject('FIND_BY_ID_TICKET_USECASE')
    private readonly findTicketByIdUseCase: FindTicketByIdUseCase,
    @Inject('UPDATE_TICKET_USECASE')
    private readonly updateTicketUseCase: UpdateTicketUseCase,
    @Inject('UPDATE_TICKET_STATUS_USECASE')
    private readonly updateTicketStatusUseCase: UpdateTicketStatusUseCase,
    @Inject('DELETE_TICKET_USECASE')
    private readonly deleteTicketUseCase: DeleteTicketUseCase,
  ) {}

  @Get()
  async findAll(): Promise<TicketResponse[]> {
    return this.findAllTicketsUseCase.execute();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<TicketResponse | null> {
    return this.findTicketByIdUseCase.execute(id);
  }

  @Post()
  async create(@Body() createRequest: TicketRequest): Promise<TicketResponse> {
    return this.createTicketUseCase.execute(createRequest);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() body: UpdateTicketRequest): Promise<TicketResponse> {
    return this.updateTicketUseCase.execute(id, body);
  }

  @Patch(':id')
  async updatePatch(@Param('id') id: string, @Body() body: UpdateTicketRequest): Promise<TicketResponse> {
    return this.updateTicketUseCase.execute(id, body);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() body: UpdateTicketStatusRequest): Promise<TicketResponse> {
    return this.updateTicketStatusUseCase.execute(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTicket(@Param('id') id: string): Promise<void> {
    await this.deleteTicketUseCase.execute(id);
  }
}

// Backward-compatibility alias
export const CreateTicketController = TicketsController;
