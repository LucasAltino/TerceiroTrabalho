import { BaseEntity, DefaultTimeStampProps } from '../../../../shared/domain/entity/base.entity';
import { ReturnStatus, ReturnStatusValue } from '../value-object/return-status.value.object';
import { TransitionRule } from '../transition/transition-rule';
import { InvalidTransitionError } from '../errors';

export type ReturnTypeValue = 'DEVOLUTION' | 'EXCHANGE';

export type ReturnRequestProps = {
  id: string;
  orderId: string;
  customerId: string;
  productId: string;
  type: ReturnTypeValue;
  reason: string;
  description: string;
  status: ReturnStatus;
  trackingCode?: string | null;
  inspectionResult?: string | null;
  rejectionReason?: string | null;
  adjustmentRequestedAt?: Date | null;
  adjustmentReason?: string | null;
  version: number;
} & DefaultTimeStampProps;

export type ReturnRequestRecord = Omit<ReturnRequestProps, 'status'> & {
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ReturnRequestEntity extends BaseEntity<ReturnRequestProps> {
  constructor(props: ReturnRequestProps) {
    super(props);
  }

  transition<Payload>(rule: TransitionRule<Payload>, payload: Payload): ReturnRequestEntity {
    if (!rule.from.includes(this.props.status.getValue())) {
      throw new InvalidTransitionError(
        `Transition "${rule.name}" not allowed from status ${this.props.status.getValue()}`,
      );
    }
    rule.validate(payload);
    const changes = rule.apply(this, payload);
    return new ReturnRequestEntity({
      ...this.props,
      ...changes,
      status: ReturnStatus.from(rule.to),
      updatedAt: new Date(),
    });
  }

  updateDetails(details: {
    reason?: string;
    description?: string;
    trackingCode?: string | null;
  }): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      reason: details.reason !== undefined ? details.reason.trim() : this.props.reason,
      description: details.description !== undefined ? details.description.trim() : this.props.description,
      trackingCode: details.trackingCode !== undefined ? details.trackingCode : this.props.trackingCode,
      updatedAt: new Date(),
    });
  }
}
