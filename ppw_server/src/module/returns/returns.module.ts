import { Module } from '@nestjs/common';
import { ReturnRequestService } from './application/service/return-request.service';
import { ReturnRequestPrismaRepository } from './infrastructure/adapters/return-request.prisma.repository';
import { ReturnRequestController } from './presentation/return-request.controller';

@Module({
  controllers: [ReturnRequestController],
  providers: [
    ReturnRequestPrismaRepository,
    { provide: 'RETURN_REQUEST_REPOSITORY', useExisting: ReturnRequestPrismaRepository },
    ReturnRequestService,
    { provide: 'CREATE_RETURN_REQUEST_USECASE', useExisting: ReturnRequestService },
    { provide: 'GET_RETURN_REQUEST_USECASE', useExisting: ReturnRequestService },
    { provide: 'LIST_RETURN_REQUESTS_USECASE', useExisting: ReturnRequestService },
    { provide: 'UPDATE_RETURN_REQUEST_USECASE', useExisting: ReturnRequestService },
    { provide: 'UPDATE_RETURN_STATUS_USECASE', useExisting: ReturnRequestService },
    { provide: 'INSPECT_RETURN_REQUEST_USECASE', useExisting: ReturnRequestService },
    { provide: 'DELETE_RETURN_REQUEST_USECASE', useExisting: ReturnRequestService },
  ],
  exports: [
    'CREATE_RETURN_REQUEST_USECASE',
    'GET_RETURN_REQUEST_USECASE',
    'LIST_RETURN_REQUESTS_USECASE',
    'UPDATE_RETURN_REQUEST_USECASE',
    'DELETE_RETURN_REQUEST_USECASE',
  ],
})
export class ReturnsModule {}
