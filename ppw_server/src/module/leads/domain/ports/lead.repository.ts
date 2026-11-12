import { LeadEntity } from '../entity/lead.entity';

export interface LeadRepository {
  save(lead: LeadEntity): Promise<LeadEntity>;
  findAll(): Promise<LeadEntity[]>;
}
