import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { TicketsModule } from '../module/tickets/tickets.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReturnsModule } from '../module/returns/returns.module';
import { LeadsModule } from '../module/leads/leads.module';
import { DomainExceptionFilter } from '../shared/presentation/domain-exception.filter';
import { AuthModule } from '../module/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule, TicketsModule, ReturnsModule, LeadsModule],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
