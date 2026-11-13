import { ReturnStatus, ReturnStatusValue } from '../value-object/return-status.value.object';
import { ReturnRequestEntity, ReturnRequestProps } from '../entity/return-request.entity';
import { InvalidTransitionError, PayloadValidationError } from '../errors';
import {
  PostRule, ReceiveRule, StartInspectionRule, ApproveRule, RejectRule,
  RequestAdjustmentRule, CompleteRule, CancelRule,
} from './return-transition-rules';

function makeEntity(status: ReturnStatusValue, overrides: Partial<ReturnRequestProps> = {}): ReturnRequestEntity {
  return new ReturnRequestEntity({
    id: 'rr-1',
    orderId: 'o-1',
    customerId: 'c-1',
    productId: 'p-1',
    type: 'DEVOLUTION',
    reason: 'Damaged',
    description: 'Box opened',
    status: ReturnStatus.from(status),
    trackingCode: null,
    inspectionResult: null,
    rejectionReason: null,
    adjustmentRequestedAt: null,
    adjustmentReason: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('PostRule', () => {
  it('transitions REQUESTED → POSTED with trackingCode', () => {
    const e = makeEntity(ReturnStatusValue.REQUESTED);
    const r = e.transition(PostRule, { trackingCode: '  TRK123  ', reverseCode: 'CODE-123' });
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.POSTED);
    expect(r.props.trackingCode).toBe('TRK123');
  });

  it('throws InvalidTransitionError from wrong status', () => {
    const e = makeEntity(ReturnStatusValue.RECEIVED);
    expect(() => e.transition(PostRule, { trackingCode: 'TRK', reverseCode: 'CODE' })).toThrow(
      InvalidTransitionError,
    );
  });

  it('throws PayloadValidationError when trackingCode is empty', () => {
    const e = makeEntity(ReturnStatusValue.REQUESTED);
    expect(() =>
      e.transition(PostRule, { trackingCode: '  ', reverseCode: 'CODE' }),
    ).toThrow(PayloadValidationError);
  });

  it('requires a reverse code', () => {
    const e = makeEntity(ReturnStatusValue.REQUESTED);
    expect(() => e.transition(PostRule, { trackingCode: 'TRK123', reverseCode: ' ' })).toThrow(
      PayloadValidationError,
    );
  });
});

describe('ReceiveRule', () => {
  it('transitions POSTED → RECEIVED', () => {
    const r = makeEntity(ReturnStatusValue.POSTED).transition(ReceiveRule, {});
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.RECEIVED);
  });

  it('throws from wrong status', () => {
    expect(() => makeEntity(ReturnStatusValue.REQUESTED).transition(ReceiveRule, {})).toThrow(InvalidTransitionError);
  });
});

describe('StartInspectionRule', () => {
  it('transitions RECEIVED → INSPECTING', () => {
    const r = makeEntity(ReturnStatusValue.RECEIVED).transition(StartInspectionRule, {});
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.INSPECTING);
  });

  it('transitions ADJUSTMENT_REQUESTED → INSPECTING', () => {
    const r = makeEntity(ReturnStatusValue.ADJUSTMENT_REQUESTED).transition(StartInspectionRule, {});
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.INSPECTING);
  });

  it('throws from REQUESTED', () => {
    expect(() => makeEntity(ReturnStatusValue.REQUESTED).transition(StartInspectionRule, {})).toThrow(InvalidTransitionError);
  });
});

describe('ApproveRule', () => {
  it('transitions INSPECTING → APPROVED with inspectionResult', () => {
    const r = makeEntity(ReturnStatusValue.INSPECTING).transition(ApproveRule, {
      inspectionResult: '  Product intact  ',
    });
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.APPROVED);
    expect(r.props.inspectionResult).toBe('Product intact');
  });

  it('throws PayloadValidationError when inspectionResult is missing', () => {
    expect(() => makeEntity(ReturnStatusValue.INSPECTING).transition(ApproveRule, { inspectionResult: '' })).toThrow(PayloadValidationError);
  });

  it('throws InvalidTransitionError from REQUESTED', () => {
    expect(() => makeEntity(ReturnStatusValue.REQUESTED).transition(ApproveRule, { inspectionResult: 'x' })).toThrow(InvalidTransitionError);
  });
});

describe('RejectRule', () => {
  it('transitions INSPECTING → REJECTED with rejectionReason', () => {
    const r = makeEntity(ReturnStatusValue.INSPECTING).transition(RejectRule, {
      rejectionReason: '  Seal broken  ',
    });
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.REJECTED);
    expect(r.props.rejectionReason).toBe('Seal broken');
  });

  it('throws PayloadValidationError when rejectionReason is missing', () => {
    expect(() => makeEntity(ReturnStatusValue.INSPECTING).transition(RejectRule, { rejectionReason: '' })).toThrow(PayloadValidationError);
  });
});

describe('RequestAdjustmentRule', () => {
  it('transitions INSPECTING → ADJUSTMENT_REQUESTED', () => {
    const r = makeEntity(ReturnStatusValue.INSPECTING).transition(RequestAdjustmentRule, { adjustmentReason: 'Missing photo' });
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.ADJUSTMENT_REQUESTED);
    expect(r.props.adjustmentReason).toBe('Missing photo');
    expect(r.props.adjustmentRequestedAt).toBeInstanceOf(Date);
    expect(r.props.reason).toBe('Damaged'); // original reason untouched
  });

  it('throws PayloadValidationError when adjustmentReason missing', () => {
    expect(() => makeEntity(ReturnStatusValue.INSPECTING).transition(RequestAdjustmentRule, { adjustmentReason: '' })).toThrow(PayloadValidationError);
  });
});

describe('CompleteRule', () => {
  it('transitions APPROVED → COMPLETED', () => {
    const r = makeEntity(ReturnStatusValue.APPROVED).transition(CompleteRule, {});
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.COMPLETED);
  });

  it('throws from INSPECTING (terminal guard)', () => {
    expect(() => makeEntity(ReturnStatusValue.INSPECTING).transition(CompleteRule, {})).toThrow(InvalidTransitionError);
  });
});

describe('CancelRule', () => {
  const cancelable = [
    ReturnStatusValue.REQUESTED, ReturnStatusValue.POSTED, ReturnStatusValue.RECEIVED,
    ReturnStatusValue.INSPECTING, ReturnStatusValue.ADJUSTMENT_REQUESTED, ReturnStatusValue.APPROVED,
  ];

  it.each(cancelable)('cancels from %s', (s) => {
    const r = makeEntity(s).transition(CancelRule, { justification: 'User request' });
    expect(r.props.status.getValue()).toBe(ReturnStatusValue.CANCELLED);
  });

  it('throws from REJECTED (terminal)', () => {
    expect(() => makeEntity(ReturnStatusValue.REJECTED).transition(CancelRule, { justification: 'x' })).toThrow(InvalidTransitionError);
  });

  it('throws from COMPLETED (terminal)', () => {
    expect(() => makeEntity(ReturnStatusValue.COMPLETED).transition(CancelRule, { justification: 'x' })).toThrow(InvalidTransitionError);
  });

  it('throws PayloadValidationError when justification missing', () => {
    expect(() => makeEntity(ReturnStatusValue.REQUESTED).transition(CancelRule, { justification: '' })).toThrow(PayloadValidationError);
  });
});
