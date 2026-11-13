import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { VersionConflictError } from '../../domain/errors';
import {
  ApproveRule,
  CancelRule,
  CompleteRule,
  PostRule,
} from '../../domain/transition/return-transition-rules';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { ReturnRequestPrismaRepository } from './return-request.prisma.repository';
import { ProportionalRefundCalculator } from '../../domain/refund/proportional-refund-calculator';
import { PayloadValidationError } from '../../domain/errors';

type MockTransaction = {
  returnRequest: {
    updateMany: jest.Mock;
    findUnique: jest.Mock;
  };
  order: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  refund: {
    create: jest.Mock;
    findUnique: jest.Mock;
    updateMany: jest.Mock;
  };
  reverseCode: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    create: jest.Mock;
  };
  returnStatusHistory: {
    create: jest.Mock;
  };
};

function createEntity(): ReturnRequestEntity {
  return new ReturnRequestEntity({
    id: 'rr-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    productId: 'product-1',
    type: 'DEVOLUTION',
    reason: 'Damaged',
    description: 'Box opened',
    status: ReturnStatus.from(ReturnStatusValue.INSPECTING),
    inspectionResult: null,
    trackingCode: null,
    rejectionReason: null,
    adjustmentRequestedAt: null,
    adjustmentReason: null,
    version: 5,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).transition(ApproveRule, { inspectionResult: 'Checked' });
}

function postEntity(): ReturnRequestEntity {
  return new ReturnRequestEntity({
    id: 'rr-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    productId: 'product-1',
    type: 'DEVOLUTION',
    reason: 'Damaged',
    description: 'Box opened',
    status: ReturnStatus.from(ReturnStatusValue.REQUESTED),
    inspectionResult: null,
    trackingCode: null,
    rejectionReason: null,
    adjustmentRequestedAt: null,
    adjustmentReason: null,
    version: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).transition(PostRule, { trackingCode: 'TRACK-1', reverseCode: 'CODE-1' });
}

describe('ReturnRequestPrismaRepository.updateWithVersion', () => {
  it('converts an updateMany count of zero into a version conflict', async () => {
    const transaction: MockTransaction = {
      returnRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
      order: { findUnique: jest.fn(), updateMany: jest.fn() },
      refund: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      reverseCode: { findUnique: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
      returnStatusHistory: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((work: (tx: MockTransaction) => Promise<unknown>) => work(transaction)),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma, new ProportionalRefundCalculator());

    await expect(
      repository.updateWithVersion(
        createEntity(),
        5,
        [ReturnStatusValue.INSPECTING],
        ReturnStatusValue.INSPECTING,
        'inspector-1',
        'Action: approve',
      ),
    ).rejects.toBeInstanceOf(VersionConflictError);
    expect(transaction.returnStatusHistory.create).not.toHaveBeenCalled();
  });

  it('rolls back the status when writing its audit record fails', async () => {
    let status: ReturnStatusValue = ReturnStatusValue.INSPECTING;
    let version = 5;
    const transaction: MockTransaction = {
      returnRequest: {
        updateMany: jest.fn(async () => {
          status = ReturnStatusValue.APPROVED;
          version += 1;
          return { count: 1 };
        }),
        findUnique: jest.fn(),
      },
      order: { findUnique: jest.fn(), updateMany: jest.fn() },
      refund: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      reverseCode: { findUnique: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
      returnStatusHistory: {
        create: jest.fn().mockRejectedValue(new Error('audit unavailable')),
      },
    };
    const prisma = {
      $transaction: jest.fn(async (work: (tx: MockTransaction) => Promise<unknown>) => {
        const previousStatus = status;
        const previousVersion = version;
        try {
          return await work(transaction);
        } catch (error) {
          status = previousStatus;
          version = previousVersion;
          throw error;
        }
      }),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma, new ProportionalRefundCalculator());

    await expect(
      repository.updateWithVersion(
        createEntity(),
        5,
        [ReturnStatusValue.INSPECTING],
        ReturnStatusValue.INSPECTING,
        'inspector-1',
        'Action: approve',
      ),
    ).rejects.toThrow('audit unavailable');

    expect(status).toBe(ReturnStatusValue.INSPECTING);
    expect(version).toBe(5);
  });

  it('creates a pending refund on approval and marks it paid on completion', async () => {
    const transaction: MockTransaction = {
      returnRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest
          .fn()
          .mockResolvedValueOnce({ items: [{ orderItemId: 'item-1', quantity: 1 }] })
          .mockResolvedValueOnce({ id: 'rr-1', status: ReturnStatusValue.APPROVED })
          .mockResolvedValue({ id: 'rr-1', status: ReturnStatusValue.COMPLETED }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'order-1',
          itemsTotal: new Prisma.Decimal('100.00'),
          couponDiscount: new Prisma.Decimal('0.00'),
          shippingPaid: new Prisma.Decimal('0.00'),
          amountPaid: new Prisma.Decimal('100.00'),
          amountRefunded: new Prisma.Decimal('0.00'),
          items: [{ id: 'item-1', unitPrice: new Prisma.Decimal('100.00'), quantity: 1 }],
          returns: [],
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refund: {
        create: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      reverseCode: { findUnique: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
      returnStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((work: (tx: MockTransaction) => Promise<unknown>) => work(transaction)),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma, new ProportionalRefundCalculator());
    const approved = createEntity();

    await repository.updateWithVersion(
      approved,
      5,
      [ReturnStatusValue.INSPECTING],
      ReturnStatusValue.INSPECTING,
      'inspector-1',
      'Action: approve',
    );

    expect(transaction.refund.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        returnRequestId: 'rr-1',
        value: new Prisma.Decimal('100.00'),
        status: 'PENDING',
      }),
    });

    const completed = approved.transition(CompleteRule, {});
    await repository.updateWithVersion(
      completed,
      5,
      [ReturnStatusValue.APPROVED],
      ReturnStatusValue.APPROVED,
      'finance-1',
      'Action: complete',
    );
    expect(transaction.refund.updateMany).toHaveBeenCalledWith({
      where: { returnRequestId: 'rr-1', status: 'PENDING' },
      data: { status: 'PAID' },
    });
  });

  it.each([
    ['missing', null, PayloadValidationError],
    [
      'expired',
      {
        id: 'code-1',
        returnRequestId: 'rr-1',
        orderId: 'order-1',
        expiresAt: new Date(Date.now() - 1000),
        usedAt: null,
      },
      PayloadValidationError,
    ],
    [
      'used',
      {
        id: 'code-1',
        returnRequestId: 'rr-1',
        orderId: 'order-1',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: new Date(),
      },
      VersionConflictError,
    ],
  ])('rejects a %s reverse code', async (_label, code, errorType) => {
    const transaction: MockTransaction = {
      returnRequest: { updateMany: jest.fn(), findUnique: jest.fn() },
      order: { findUnique: jest.fn(), updateMany: jest.fn() },
      refund: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
      reverseCode: { findUnique: jest.fn().mockResolvedValue(code), updateMany: jest.fn(), create: jest.fn() },
      returnStatusHistory: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((work: (tx: MockTransaction) => Promise<unknown>) => work(transaction)),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma, new ProportionalRefundCalculator());

    await expect(
      repository.updateWithVersion(
        postEntity(),
        0,
        [ReturnStatusValue.REQUESTED],
        ReturnStatusValue.REQUESTED,
        'customer-1',
        'Action: post',
        'CODE-1',
      ),
    ).rejects.toBeInstanceOf(errorType);
    expect(transaction.returnRequest.updateMany).not.toHaveBeenCalled();
  });

  it('cancels an approved return, invalidates the code, and reverses its pending refund atomically', async () => {
    const transaction: MockTransaction = {
      returnRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ id: 'rr-1', status: ReturnStatusValue.CANCELLED }),
      },
      order: {
        findUnique: jest.fn().mockResolvedValue({ amountRefunded: new Prisma.Decimal('25.00') }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      refund: {
        create: jest.fn(),
        findUnique: jest.fn().mockResolvedValue({
          value: new Prisma.Decimal('25.00'),
          status: 'PENDING',
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      reverseCode: { findUnique: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 1 }), create: jest.fn() },
      returnStatusHistory: { create: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      $transaction: jest.fn((work: (tx: MockTransaction) => Promise<unknown>) => work(transaction)),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma, new ProportionalRefundCalculator());
    const cancelled = createEntity().transition(CancelRule, { justification: 'Customer changed their mind' });

    await repository.updateWithVersion(
      cancelled,
      5,
      [ReturnStatusValue.APPROVED],
      ReturnStatusValue.APPROVED,
      'customer-1',
      'Customer changed their mind',
    );

    expect(transaction.reverseCode.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ returnRequestId: 'rr-1' }),
        data: expect.objectContaining({ expiresAt: expect.any(Date) }),
      }),
    );
    expect(transaction.refund.updateMany).toHaveBeenCalledWith({
      where: { returnRequestId: 'rr-1', status: 'PENDING' },
      data: { status: 'REVERSED' },
    });
    expect(transaction.order.updateMany).toHaveBeenCalledWith({
      where: { id: 'order-1', amountRefunded: new Prisma.Decimal('25.00') },
      data: { amountRefunded: { decrement: new Prisma.Decimal('25.00') } },
    });
  });
});
