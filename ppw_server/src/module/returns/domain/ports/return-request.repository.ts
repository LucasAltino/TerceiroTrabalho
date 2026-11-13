import { ReturnRequest } from '@prisma/client';
import { ReturnRequestEntity } from '../entity/return-request.entity';
import { ReturnStatusValue } from '../value-object/return-status.value.object';

export interface ReturnRequestRepository {
  create(request: ReturnRequestEntity): Promise<ReturnRequest>;
  findById(id: string): Promise<ReturnRequest | null>;
  findAll(customerId?: string): Promise<ReturnRequest[]>;
  update(request: ReturnRequestEntity): Promise<ReturnRequest>;
  updateWithVersion(
    request: ReturnRequestEntity,
    expectedVersion: number,
    from: ReturnStatusValue[],
  ): Promise<ReturnRequest>;
}
