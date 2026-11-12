import { Inject, Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/leads.dto';
import { LeadEntity } from './domain/entity/lead.entity';
import { LeadRepository } from './domain/ports/lead.repository';
import { CreateLeadUseCase } from './application/use-case/create-lead.usecase';

@Injectable()
export class LeadsService implements CreateLeadUseCase {
  constructor(
    @Inject('LEAD_REPOSITORY')
    private readonly repository: LeadRepository,
  ) {}

  async execute(dto: CreateLeadDto): Promise<{ message: string; email: string }> {
    const lead = new LeadEntity(dto.email.trim().toLowerCase());
    await this.repository.save(lead);
    return { message: 'Lead created successfully', email: lead.email };
  }

  async create(createLeadDto: CreateLeadDto) {
    return this.execute(createLeadDto);
  }
}
