import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { VersionConflictError } from '../../domain/errors';
import { ApproveRule } from '../../domain/transition/return-transition-rules';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { ReturnRequestPrismaRepository } from './return-request.prisma.repository';

type MockTransaction = {
  returnRequest: {
    updateMany: jest.Mock;
    findUnique: jest.Mock;
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

describe('ReturnRequestPrismaRepository.updateWithVersion', () => {
  it('converts an updateMany count of zero into a version conflict', async () => {
    const transaction: MockTransaction = {
      returnRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        findUnique: jest.fn(),
      },
      returnStatusHistory: { create: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn((work: (tx: MockTransaction) => Promise<unknown>) => work(transaction)),
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma);

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
    const repository = new ReturnRequestPrismaRepository(prisma);

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
});
