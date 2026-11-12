import { Module } from '@nestjs/common';
import { TicketsModule } from '../module/tickets/tickets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReturnsModule } from '../module/returns/returns.module';
import { LeadsModule } from '../module/leads/leads.module';

@Module({
  imports: [PrismaModule, TicketsModule, ReturnsModule, LeadsModule],
})
export class AppModule {}
