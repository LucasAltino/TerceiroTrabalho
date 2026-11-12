import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { LeadInMemoryRepository } from './infrastructure/adapters/lead.in-memory.repository';

@Module({
  controllers: [LeadsController],
  providers: [
    LeadInMemoryRepository,
    {
      provide: 'LEAD_REPOSITORY',
      useClass: LeadInMemoryRepository,
    },
    LeadsService,
    {
      provide: 'CREATE_LEAD_USECASE',
      useClass: LeadsService,
    },
  ],
  exports: ['CREATE_LEAD_USECASE'],
})
export class LeadsModule {}
