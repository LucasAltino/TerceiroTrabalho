import { randomBytes, randomUUID } from 'crypto';
import { Prisma, Role, ReturnStatus as PrismaReturnStatus } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ReturnRequestEntity } from '../../domain/entity/return-request.entity';
import { VersionConflictError } from '../../domain/errors';
import { PostRule } from '../../domain/transition/return-transition-rules';
import { ProportionalRefundCalculator } from '../../domain/refund/proportional-refund-calculator';
import { ReturnStatus, ReturnStatusValue } from '../../domain/value-object/return-status.value.object';
import { ReturnRequestPrismaRepository } from './return-request.prisma.repository';

const postgresDescribe = process.env.RUN_POSTGRES_INTEGRATION_TESTS === '1' ? describe : describe.skip;

postgresDescribe('PostgreSQL return posting concurrency', () => {
  const userId = randomUUID();
  const orderId = randomUUID();
  const orderItemId = randomUUID();
  const returnRequestId = randomUUID();
  const code = randomBytes(32).toString('base64url');
  let prisma: PrismaService;

  beforeAll(async () => {
    prisma = new PrismaService();
    await prisma.$connect();
    await prisma.user.create({
      data: {
        id: userId,
        email: `${userId}@example.test`,
        passwordHash: 'not-used-by-this-test',
        role: Role.CUSTOMER,
      },
    });
    await prisma.order.create({
      data: {
        id: orderId,
        itemsTotal: new Prisma.Decimal('100.00'),
        couponDiscount: new Prisma.Decimal('0.00'),
        shippingPaid: new Prisma.Decimal('0.00'),
        amountPaid: new Prisma.Decimal('100.00'),
      },
    });
    await prisma.orderItem.create({
      data: {
        id: orderItemId,
        orderId,
        productId: 'product-1',
        unitPrice: new Prisma.Decimal('100.00'),
        quantity: 1,
      },
    });
    await prisma.returnRequest.create({
      data: {
        id: returnRequestId,
        orderId,
        customerId: userId,
        productId: 'product-1',
        type: 'DEVOLUTION',
        reason: 'Damaged',
        description: 'Box opened',
        status: PrismaReturnStatus.REQUESTED,
        items: { create: { orderItemId, quantity: 1 } },
      },
    });
    await prisma.reverseCode.create({
      data: {
        code,
        returnRequestId,
        orderId,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.returnStatusHistory.deleteMany({ where: { returnRequestId } });
    await prisma.reverseCode.deleteMany({ where: { returnRequestId } });
    await prisma.returnItem.deleteMany({ where: { returnRequestId } });
    await prisma.returnRequest.deleteMany({ where: { id: returnRequestId } });
    await prisma.orderItem.deleteMany({ where: { id: orderItemId } });
    await prisma.order.deleteMany({ where: { id: orderId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('allows exactly one of two simultaneous posts to consume the code', async () => {
    const repository = new ReturnRequestPrismaRepository(
      prisma,
      new ProportionalRefundCalculator(),
    );
    const createPostedEntity = () =>
      new ReturnRequestEntity({
        id: returnRequestId,
        orderId,
        customerId: userId,
        productId: 'product-1',
        type: 'DEVOLUTION',
        reason: 'Damaged',
        description: 'Box opened',
        status: ReturnStatus.from(ReturnStatusValue.REQUESTED),
        trackingCode: null,
        inspectionResult: null,
        rejectionReason: null,
        adjustmentRequestedAt: null,
        adjustmentReason: null,
        version: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).transition(PostRule, { trackingCode: 'TRACK-1', reverseCode: code });
    const attempt = () =>
      repository.updateWithVersion(
        createPostedEntity(),
        0,
        [ReturnStatusValue.REQUESTED],
        ReturnStatusValue.REQUESTED,
        userId,
        'Action: post',
        code,
      );

    const outcomes = await Promise.allSettled([attempt(), attempt()]);

    expect(outcomes.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = outcomes.find((result) => result.status === 'rejected');
    expect(rejected).toBeDefined();
    if (rejected?.status === 'rejected') {
      expect(rejected.reason).toBeInstanceOf(VersionConflictError);
    }

    const [savedRequest, usedCode, auditCount] = await Promise.all([
      prisma.returnRequest.findUniqueOrThrow({ where: { id: returnRequestId } }),
      prisma.reverseCode.findUniqueOrThrow({ where: { code } }),
      prisma.returnStatusHistory.count({ where: { returnRequestId } }),
    ]);
    expect(savedRequest.status).toBe(PrismaReturnStatus.POSTED);
    expect(savedRequest.version).toBe(1);
    expect(usedCode.usedAt).not.toBeNull();
    expect(auditCount).toBe(1);
  });
});
