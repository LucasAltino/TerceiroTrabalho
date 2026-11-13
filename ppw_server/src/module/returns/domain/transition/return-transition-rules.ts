import { PayloadValidationError } from '../errors';
import { ReturnStatusValue } from '../value-object/return-status.value.object';
import { TransitionRule } from './transition-rule';

export type PostPayload = { trackingCode: string; reverseCode: string };
export type ReceivePayload = Record<string, never>;
export type StartInspectionPayload = Record<string, never>;
export type ApprovePayload = { inspectionResult: string };
export type RejectPayload = { rejectionReason: string };
export type RequestAdjustmentPayload = { adjustmentReason: string };
export type CompletePayload = Record<string, never>;
export type CancelPayload = { justification: string };
export type TransitionPayload =
  | PostPayload
  | ReceivePayload
  | StartInspectionPayload
  | ApprovePayload
  | RejectPayload
  | RequestAdjustmentPayload
  | CompletePayload
  | CancelPayload;

function requireTrimmed(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new PayloadValidationError(`${field} is required`);
  }
}

export const PostRule: TransitionRule<PostPayload> = {
  name: 'post',
  from: [ReturnStatusValue.REQUESTED],
  to: ReturnStatusValue.POSTED,
  validate(payload) {
    requireTrimmed(payload?.trackingCode, 'trackingCode');
    requireTrimmed(payload?.reverseCode, 'reverseCode');
  },
  apply(_entity, payload) {
    return { trackingCode: payload.trackingCode.trim() };
  },
};

export const ReceiveRule: TransitionRule<ReceivePayload> = {
  name: 'receive',
  from: [ReturnStatusValue.POSTED],
  to: ReturnStatusValue.RECEIVED,
  validate() {},
  apply() {
    return {};
  },
};

export const StartInspectionRule: TransitionRule<StartInspectionPayload> = {
  name: 'startInspection',
  from: [ReturnStatusValue.RECEIVED, ReturnStatusValue.ADJUSTMENT_REQUESTED],
  to: ReturnStatusValue.INSPECTING,
  validate() {},
  apply() {
    return {};
  },
};

export const ApproveRule: TransitionRule<ApprovePayload> = {
  name: 'approve',
  from: [ReturnStatusValue.INSPECTING],
  to: ReturnStatusValue.APPROVED,
  validate(payload) {
    requireTrimmed(payload?.inspectionResult, 'inspectionResult');
  },
  apply(_entity, payload) {
    return { inspectionResult: payload.inspectionResult.trim() };
  },
};

export const RejectRule: TransitionRule<RejectPayload> = {
  name: 'reject',
  from: [ReturnStatusValue.INSPECTING],
  to: ReturnStatusValue.REJECTED,
  validate(payload) {
    requireTrimmed(payload?.rejectionReason, 'rejectionReason');
  },
  apply(_entity, payload) {
    return { rejectionReason: payload.rejectionReason.trim() };
  },
};

export const RequestAdjustmentRule: TransitionRule<RequestAdjustmentPayload> = {
  name: 'requestAdjustment',
  from: [ReturnStatusValue.INSPECTING],
  to: ReturnStatusValue.ADJUSTMENT_REQUESTED,
  validate(payload) {
    requireTrimmed(payload?.adjustmentReason, 'adjustmentReason');
  },
  apply(_entity, payload) {
    return {
      adjustmentRequestedAt: new Date(),
      adjustmentReason: payload.adjustmentReason.trim(),
    };
  },
};

export const CompleteRule: TransitionRule<CompletePayload> = {
  name: 'complete',
  from: [ReturnStatusValue.APPROVED],
  to: ReturnStatusValue.COMPLETED,
  validate() {},
  apply() {
    return {};
  },
};

export const CancelRule: TransitionRule<CancelPayload> = {
  name: 'cancel',
  from: [
    ReturnStatusValue.REQUESTED,
    ReturnStatusValue.POSTED,
    ReturnStatusValue.RECEIVED,
    ReturnStatusValue.INSPECTING,
    ReturnStatusValue.ADJUSTMENT_REQUESTED,
    ReturnStatusValue.APPROVED,
  ],
  to: ReturnStatusValue.CANCELLED,
  validate(payload) {
    requireTrimmed(payload?.justification, 'justification');
  },
  apply() {
    return {};
  },
};

export const TRANSITION_RULES: Record<
  | 'post'
  | 'receive'
  | 'startInspection'
  | 'approve'
  | 'reject'
  | 'requestAdjustment'
  | 'complete'
  | 'cancel',
  TransitionRule<TransitionPayload>
> = {
  post: PostRule,
  receive: ReceiveRule,
  startInspection: StartInspectionRule,
  approve: ApproveRule,
  reject: RejectRule,
  requestAdjustment: RequestAdjustmentRule,
  complete: CompleteRule,
  cancel: CancelRule,
};
