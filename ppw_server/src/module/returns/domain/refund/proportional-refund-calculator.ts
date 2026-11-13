import { PayloadValidationError } from '../errors';
import { RefundCalculationInput, RefundStrategy, ReturnQuantity } from './refund-strategy';

type DiscountAllocation = {
  orderItemId: string;
  cents: bigint;
  remainder: bigint;
};

export class ProportionalRefundCalculator implements RefundStrategy {
  calculate(input: RefundCalculationInput): bigint {
    this.validateMoney(input);
    if (input.orderItems.length === 0 || input.requestedItems.length === 0) {
      throw new PayloadValidationError('At least one order item must be returned');
    }

    const itemById = new Map(input.orderItems.map((item) => [item.id, item]));
    if (itemById.size !== input.orderItems.length) {
      throw new PayloadValidationError('Order item ids must be unique');
    }

    const itemsSubtotal = input.orderItems.reduce((sum, item) => {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.unitPriceCents < 0n) {
        throw new PayloadValidationError('Order item values and quantities must be positive');
      }
      return sum + item.unitPriceCents * BigInt(item.quantity);
    }, 0n);
    if (itemsSubtotal !== input.itemsTotalCents) {
      throw new PayloadValidationError('Order item subtotal does not match itemsTotal');
    }
    if (input.couponDiscountCents > itemsSubtotal) {
      throw new PayloadValidationError('Coupon discount cannot exceed the item subtotal');
    }

    const returnedQuantities = new Map<string, number>();
    this.addQuantities(returnedQuantities, input.previouslyReturnedItems, itemById);
    this.addQuantities(returnedQuantities, input.requestedItems, itemById);

    const discountByItem = this.allocateDiscount(input.couponDiscountCents, input.orderItems);
    let returnedSubtotal = 0n;
    let returnedDiscount = 0n;
    let allItemsReturned = true;

    for (const item of input.orderItems) {
      const quantityReturned = returnedQuantities.get(item.id) ?? 0;
      if (quantityReturned > item.quantity) {
        throw new PayloadValidationError(`Returned quantity exceeds ordered quantity for ${item.id}`);
      }
      if (quantityReturned < item.quantity) allItemsReturned = false;
      returnedSubtotal += item.unitPriceCents * BigInt(quantityReturned);
      const discount = discountByItem.get(item.id) ?? 0n;
      returnedDiscount +=
        quantityReturned === item.quantity
          ? discount
          : (discount * BigInt(quantityReturned)) / BigInt(item.quantity);
    }

    const cumulativeRefund =
      returnedSubtotal -
      returnedDiscount +
      (allItemsReturned ? input.shippingPaidCents : 0n);
    const availablePaidAmount = input.amountPaidCents - input.amountAlreadyRefundedCents;
    const currentRefund = cumulativeRefund - input.amountAlreadyRefundedCents;
    if (availablePaidAmount < 0n || currentRefund < 0n) {
      throw new PayloadValidationError('Previously refunded amount exceeds the refundable order amount');
    }
    return currentRefund < availablePaidAmount ? currentRefund : availablePaidAmount;
  }

  private validateMoney(input: RefundCalculationInput): void {
    const amounts = [
      input.itemsTotalCents,
      input.couponDiscountCents,
      input.shippingPaidCents,
      input.amountPaidCents,
      input.amountAlreadyRefundedCents,
    ];
    if (amounts.some((amount) => amount < 0n)) {
      throw new PayloadValidationError('Monetary values cannot be negative');
    }
  }

  private addQuantities(
    total: Map<string, number>,
    quantities: readonly ReturnQuantity[],
    itemById: ReadonlyMap<string, { quantity: number }>,
  ): void {
    for (const item of quantities) {
      if (!Number.isInteger(item.quantity) || item.quantity <= 0 || !itemById.has(item.orderItemId)) {
        throw new PayloadValidationError('Returned item is invalid');
      }
      total.set(item.orderItemId, (total.get(item.orderItemId) ?? 0) + item.quantity);
    }
  }

  private allocateDiscount(
    discountCents: bigint,
    items: RefundCalculationInput['orderItems'],
  ): Map<string, bigint> {
    const subtotal = items.reduce((sum, item) => sum + item.unitPriceCents * BigInt(item.quantity), 0n);
    if (subtotal === 0n) return new Map(items.map((item) => [item.id, 0n]));

    const allocations: DiscountAllocation[] = items.map((item) => {
      const weightedDiscount = discountCents * item.unitPriceCents * BigInt(item.quantity);
      return {
        orderItemId: item.id,
        cents: weightedDiscount / subtotal,
        remainder: weightedDiscount % subtotal,
      };
    });

    let centsLeft = discountCents - allocations.reduce((sum, allocation) => sum + allocation.cents, 0n);
    const byLargestRemainder = [...allocations].sort((a, b) => {
      if (a.remainder === b.remainder) return a.orderItemId.localeCompare(b.orderItemId);
      return a.remainder > b.remainder ? -1 : 1;
    });
    for (const allocation of byLargestRemainder) {
      if (centsLeft === 0n) break;
      allocation.cents += 1n;
      centsLeft -= 1n;
    }

    return new Map(allocations.map((allocation) => [allocation.orderItemId, allocation.cents]));
  }
}
