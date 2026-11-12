import { Body, Controller, Inject, Post } from '@nestjs/common';
import { CreateLeadDto } from './dto/leads.dto';
import { CreateLeadUseCase } from './application/use-case/create-lead.usecase';

@Controller('leads')
export class LeadsController {
  constructor(
    @Inject('CREATE_LEAD_USECASE')
    private readonly createLeadUseCase: CreateLeadUseCase,
  ) {}

  @Post()
  async create(@Body() createLeadDto: CreateLeadDto) {
    return this.createLeadUseCase.execute(createLeadDto);
  }
}
