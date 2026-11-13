import { ReturnRequest } from '@prisma/client';
import { ReturnRequestEntity } from '../entity/return-request.entity';
import { ReturnStatusValue } from '../value-object/return-status.value.object';
import { ReturnQuantity } from '../refund/refund-strategy';

export type CreatedReturnRequest = {
  request: ReturnRequest;
  reverseCode: string;
};

export interface ReturnRequestRepository {
  create(request: ReturnRequestEntity, items: ReturnQuantity[]): Promise<CreatedReturnRequest>;
  findById(id: string): Promise<ReturnRequest | null>;
  findAll(customerId?: string): Promise<ReturnRequest[]>;
  update(request: ReturnRequestEntity): Promise<ReturnRequest>;
  updateWithVersion(
    request: ReturnRequestEntity,
    expectedVersion: number,
    from: ReturnStatusValue[],
    previousStatus: ReturnStatusValue,
    actorId: string,
    justification: string,
    reverseCode?: string,
  ): Promise<ReturnRequest>;
}
