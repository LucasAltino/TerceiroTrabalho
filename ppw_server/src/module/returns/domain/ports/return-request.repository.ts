import { ReturnRequestEntity, ReturnRequestRecord } from '../entity/return-request.entity';
import { ReturnStatusValue } from '../value-object/return-status.value.object';
import { ReturnQuantity } from '../refund/refund-strategy';

export type CreatedReturnRequest = {
  request: ReturnRequestRecord;
  reverseCode: string;
};

export interface ReturnRequestRepository {
  create(request: ReturnRequestEntity, items: ReturnQuantity[]): Promise<CreatedReturnRequest>;
  findById(id: string): Promise<ReturnRequestRecord | null>;
  findAll(customerId?: string): Promise<ReturnRequestRecord[]>;
  update(request: ReturnRequestEntity): Promise<ReturnRequestRecord>;
  updateWithVersion(
    request: ReturnRequestEntity,
    expectedVersion: number,
    from: ReturnStatusValue[],
    previousStatus: ReturnStatusValue,
    actorId: string,
    justification: string,
    reverseCode?: string,
  ): Promise<ReturnRequestRecord>;
}
