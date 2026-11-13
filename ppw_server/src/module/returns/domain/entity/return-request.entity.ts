import { BaseEntity, DefaultTimeStampProps } from '../../../../shared/domain/entity/base.entity';
import { ReturnStatus, ReturnStatusValue } from '../value-object/return-status.value.object';
import { TransitionRule } from '../transition/transition-rule';
import { InvalidTransitionError, PayloadValidationError } from '../errors';

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

export class ReturnRequestEntity extends BaseEntity<ReturnRequestProps> {
  constructor(props: ReturnRequestProps) { super(props); }

  /** @deprecated use transition() instead */
  mudarStatusPara(novoStatus: ReturnStatusValue): ReturnRequestEntity {
    const statusAtual = this.props.status.getValue();
    const proximosStatusPermitidos: Record<ReturnStatusValue, ReturnStatusValue[]> = {
      REQUESTED: [ReturnStatusValue.POSTED],
      POSTED: [ReturnStatusValue.RECEIVED],
      RECEIVED: [ReturnStatusValue.INSPECTING],
      INSPECTING: [ReturnStatusValue.APPROVED, ReturnStatusValue.REJECTED],
      APPROVED: [ReturnStatusValue.COMPLETED],
      REJECTED: [],
      COMPLETED: [],
    };
    if (!proximosStatusPermitidos[statusAtual].includes(novoStatus)) {
      throw new InvalidTransitionError(`Invalid return transition: ${statusAtual} -> ${novoStatus}`);
    }
    return new ReturnRequestEntity({
      ...this.props,
      status: ReturnStatus.from(novoStatus),
      updatedAt: new Date(),
    });
  }

  /**
   * Generic transition entry point.
   * It checks the rule's allowed origins, validates the payload and applies the rule.
   */
  transition(rule: TransitionRule<any>, payload: any): ReturnRequestEntity {
    // 1️⃣ verify origin
    if (!rule.from.includes(this.props.status.getValue())) {
      throw new InvalidTransitionError(
        `Transition ${rule.name} not allowed from status ${this.props.status.getValue()}`,
      );
    }
    // 2️⃣ validate payload (rule may throw PayloadValidationError)
    rule.validate(payload);
    // 3️⃣ apply rule – returns a new entity instance
    return rule.apply(this, payload);
  }

  // -------------------------------------------------------------------
  // Helper mutators – used by TransitionRule.apply implementations
  // -------------------------------------------------------------------
  withStatus(newStatus: ReturnStatusValue): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      status: ReturnStatus.from(newStatus),
      updatedAt: new Date(),
    });
  }

  setInspectionResult(result: string): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      inspectionResult: result,
      updatedAt: new Date(),
    });
  }

  setRejectionReason(reason: string): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      rejectionReason: reason,
      updatedAt: new Date(),
    });
  }

  setAdjustmentRequestedAt(date: Date, reason: string): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      adjustmentRequestedAt: date,
      adjustmentReason: reason,
      updatedAt: new Date(),
    });
  }

  updateDetails(dados: { reason?: string; description?: string; trackingCode?: string | null }): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      reason: dados.reason !== undefined ? dados.reason.trim() : this.props.reason,
      description: dados.description !== undefined ? dados.description.trim() : this.props.description,
      trackingCode: dados.trackingCode !== undefined ? dados.trackingCode : this.props.trackingCode,
      updatedAt: new Date(),
    });
  }
}
 } from '../../../../shared/domain/entity/base.entity';
import { ReturnStatus, ReturnStatusValue } from '../value-object/return-status.value.object';

export type ReturnTypeValue = 'DEVOLUTION' | 'EXCHANGE';
export type ReturnRequestProps = {
  id: string; orderId: string; customerId: string; productId: string;
  type: ReturnTypeValue; reason: string; description: string; status: ReturnStatus;
  trackingCode?: string | null; inspectionResult?: string | null; rejectionReason?: string | null;
} & DefaultTimeStampProps;

export class ReturnRequestEntity extends BaseEntity<ReturnRequestProps> {
  constructor(props: ReturnRequestProps) { super(props); }

  mudarStatusPara(novoStatus: ReturnStatusValue): ReturnRequestEntity {
    const statusAtual = this.props.status.getValue();
    const proximosStatusPermitidos: Record<ReturnStatusValue, ReturnStatusValue[]> = {
      REQUESTED: [ReturnStatusValue.POSTED], POSTED: [ReturnStatusValue.RECEIVED],
      RECEIVED: [ReturnStatusValue.INSPECTING], INSPECTING: [ReturnStatusValue.APPROVED, ReturnStatusValue.REJECTED],
      APPROVED: [ReturnStatusValue.COMPLETED], REJECTED: [], COMPLETED: [],
    };
    if (!proximosStatusPermitidos[statusAtual].includes(novoStatus)) {
      throw new Error(`Invalid return transition: ${statusAtual} -> ${novoStatus}`);
    }
    return new ReturnRequestEntity({ ...this.props, status: ReturnStatus.from(novoStatus), updatedAt: new Date() });
  }

  updateDetails(dados: { reason?: string; description?: string; trackingCode?: string | null }): ReturnRequestEntity {
    return new ReturnRequestEntity({
      ...this.props,
      reason: dados.reason !== undefined ? dados.reason.trim() : this.props.reason,
      description: dados.description !== undefined ? dados.description.trim() : this.props.description,
      trackingCode: dados.trackingCode !== undefined ? dados.trackingCode : this.props.trackingCode,
      updatedAt: new Date(),
    });
  }
}
