import { ReturnStatusValue } from '../value-object/return-status.value.object';
import { ReturnRequestEntity } from '../entity/return-request.entity';
import { PayloadValidationError } from '../errors';

export interface TransitionRule<Payload = any> {
  /** name of the action, e.g. 'approve', 'reject', ... */
  name: string;
  /** allowed origin statuses */
  from: ReturnStatusValue[];
  /** target status after successful transition */
  to: ReturnStatusValue;
  /** validate payload; throw PayloadValidationError on failure */
  validate(payload: Payload): void;
  /** apply rule – must return a new ReturnRequestEntity */
  apply(entity: ReturnRequestEntity, payload: Payload): ReturnRequestEntity;
}
<Payload = any> {
  /** name of the action, e.g. 'approve', 'reject', ... */
  name: string;
  /** allowed origin statuses */
  from: ReturnStatusValue[];
  /** target status after successful transition */
  to: ReturnStatusValue;
  /** validate payload; throw PayloadValidationError on failure */
  validate(payload: Payload): void;
  /** apply rule – must return a new ReturnRequestEntity */
  apply(entity: ReturnRequestEntity, payload: Payload): ReturnRequestEntity;
}
