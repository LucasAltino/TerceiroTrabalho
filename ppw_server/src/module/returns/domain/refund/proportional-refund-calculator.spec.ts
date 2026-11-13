import { calculateReturnRefund } from './calculate-return-refund';
import { ProportionalRefundCalculator } from './proportional-refund-calculator';
import { RefundCalculationInput, RefundStrategy } from './refund-strategy';

function input(overrides: Partial<RefundCalculationInput> = {}): RefundCalculationInput {
  return {
    itemsTotalCents: 60000n,
    couponDiscountCents: 5000n,
    shippingPaidCents: 0n,
    amountPaidCents: 55000n,
    amountAlreadyRefundedCents: 0n,
    orderItems: [
      { id: 'item-100', unitPriceCents: 10000n, quantity: 1 },
      { id: 'item-200', unitPriceCents: 20000n, quantity: 1 },
      { id: 'item-300', unitPriceCents: 30000n, quantity: 1 },
    ],
    previouslyReturnedItems: [],
    requestedItems: [{ orderItemId: 'item-100', quantity: 1 }],
    ...overrides,
  };
}

describe('ProportionalRefundCalculator', () => {
  const calculator = new ProportionalRefundCalculator();

  it('distributes coupon cents by largest remainder and returns R$ 91.67 for the R$ 100 item', () => {
    expect(calculator.calculate(input())).toBe(9167n);
  });

  it('returns all item value and paid shipping when every quantity is returned', () => {
    const result = calculator.calculate(
      input({
        shippingPaidCents: 1500n,
        amountPaidCents: 56500n,
        requestedItems: [
          { orderItemId: 'item-100', quantity: 1 },
          { orderItemId: 'item-200', quantity: 1 },
          { orderItemId: 'item-300', quantity: 1 },
        ],
      }),
    );
    expect(result).toBe(56500n);
  });

  it('calculates a partial quantity proportionally without refunding paid shipping', () => {
    expect(
      calculator.calculate(
        input({
          itemsTotalCents: 90000n,
          couponDiscountCents: 9000n,
          shippingPaidCents: 3000n,
          amountPaidCents: 84000n,
          orderItems: [{ id: 'item-300', unitPriceCents: 30000n, quantity: 3 }],
          requestedItems: [{ orderItemId: 'item-300', quantity: 1 }],
        }),
      ),
    ).toBe(27000n);
  });

  it('refunds shipping only on the final return in a partially returned order', () => {
    expect(
      calculator.calculate(
        input({
          itemsTotalCents: 20000n,
          couponDiscountCents: 1000n,
          shippingPaidCents: 500n,
          amountPaidCents: 19500n,
          orderItems: [
            { id: 'item-a', unitPriceCents: 10000n, quantity: 1 },
            { id: 'item-b', unitPriceCents: 10000n, quantity: 1 },
          ],
          previouslyReturnedItems: [{ orderItemId: 'item-a', quantity: 1 }],
          requestedItems: [{ orderItemId: 'item-b', quantity: 1 }],
          amountAlreadyRefundedCents: 9500n,
        }),
      ),
    ).toBe(10000n);
  });

  it('never refunds more than the paid amount', () => {
    expect(
      calculator.calculate(
        input({
          itemsTotalCents: 10000n,
          couponDiscountCents: 0n,
          amountPaidCents: 5000n,
          orderItems: [{ id: 'only', unitPriceCents: 10000n, quantity: 1 }],
          requestedItems: [{ orderItemId: 'only', quantity: 1 }],
        }),
      ),
    ).toBe(5000n);
  });

  it('does not refund exchanges and enforces the strategy contract', () => {
    const violatingStrategy: RefundStrategy = { calculate: () => 60000n };
    expect(calculateReturnRefund('EXCHANGE', violatingStrategy, input())).toBe(0n);
    expect(() => calculateReturnRefund('DEVOLUTION', violatingStrategy, input())).toThrow(
      'Refund strategy exceeded',
    );
  });
});
