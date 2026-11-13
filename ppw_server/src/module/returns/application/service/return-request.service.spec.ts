import { ReturnRequestService } from './return-request.service';
import { ReturnRequestRepository } from '../../domain/ports/return-request.repository';
import { ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { VersionConflictError } from '../../domain/errors';

function request(status: ReturnStatusValue, version = 3) {
  return {
    id: 'rr-1',
    orderId: 'o-1',
    customerId: 'c-1',
    productId: 'p-1',
    type: 'DEVOLUTION' as const,
    reason: 'Damaged',
    description: 'Box opened',
    status,
    trackingCode: null,
    inspectionResult: null,
    rejectionReason: null,
    adjustmentRequestedAt: null,
    adjustmentReason: null,
    version,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };
}

describe('ReturnRequestService concurrency', () => {
  it('passes the current version and rule origins to the versioned repository port', async () => {
    const repository: ReturnRequestRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(request(ReturnStatusValue.INSPECTING, 7)),
      findAll: jest.fn(),
      update: jest.fn(),
      updateWithVersion: jest.fn().mockResolvedValue({
        ...request(ReturnStatusValue.APPROVED, 8),
        inspectionResult: 'Looks good',
      }),
    };
    const service = new ReturnRequestService(repository);

    await service.transicionar('rr-1', 'approve', { inspectionResult: '  Looks good  ' }, 'inspector-1');

    expect(repository.updateWithVersion).toHaveBeenCalledWith(
      expect.objectContaining({ props: expect.objectContaining({ status: expect.anything() }) }),
      7,
      [ReturnStatusValue.INSPECTING],
      ReturnStatusValue.INSPECTING,
      'inspector-1',
      'Action: approve',
      undefined,
    );
  });

  it('surfaces a version conflict when another transition wins', async () => {
    const repository: ReturnRequestRepository = {
      create: jest.fn(),
      findById: jest.fn().mockResolvedValue(request(ReturnStatusValue.INSPECTING)),
      findAll: jest.fn(),
      update: jest.fn(),
      updateWithVersion: jest.fn().mockRejectedValue(new VersionConflictError('conflict')),
    };
    const service = new ReturnRequestService(repository);

    await expect(
      service.transicionar('rr-1', 'approve', { inspectionResult: 'Looks good' }, 'inspector-1'),
    ).rejects.toBeInstanceOf(VersionConflictError);
  });
});
