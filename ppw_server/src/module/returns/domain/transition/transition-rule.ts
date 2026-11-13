import { ReturnRequestEntity } from '../entity/return-request.entity';
import { ReturnStatusValue } from '../value-object/return-status.value.object';

export type TransitionChanges = {
  trackingCode?: string | null;
  inspectionResult?: string | null;
  rejectionReason?: string | null;
  adjustmentRequestedAt?: Date | null;
  adjustmentReason?: string | null;
};

export interface TransitionRule<Payload = unknown> {
  name: string;
  from: ReturnStatusValue[];
  to: ReturnStatusValue;
  validate(payload: Payload): void;
  apply(entity: ReturnRequestEntity, payload: Payload): TransitionChanges;
}
