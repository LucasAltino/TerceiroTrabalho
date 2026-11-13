import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { VersionConflictError } from '../../domain/errors';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { ApproveRule } from '../../domain/transition/return-transition-rules';
import { ReturnRequestPrismaRepository } from './return-request.prisma.repository';

describe('ReturnRequestPrismaRepository.updateWithVersion', () => {
  it('converts an updateMany count of zero into a version conflict', async () => {
    const prisma = {
      returnRequest: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaService;
    const repository = new ReturnRequestPrismaRepository(prisma);
    const entity = new ReturnRequestEntity({
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

    await expect(
      repository.updateWithVersion(entity, 5, [ReturnStatusValue.INSPECTING]),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });
});
