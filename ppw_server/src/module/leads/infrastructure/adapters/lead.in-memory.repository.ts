import { Injectable } from '@nestjs/common';
import { LeadEntity } from '../../domain/entity/lead.entity';
import { LeadRepository } from '../../domain/ports/lead.repository';

@Injectable()
export class LeadInMemoryRepository implements LeadRepository {
  private readonly leads: LeadEntity[] = [];

  async save(lead: LeadEntity): Promise<LeadEntity> {
    this.leads.push(lead);
    return lead;
  }

  async findAll(): Promise<LeadEntity[]> {
    return [...this.leads];
  }
}
