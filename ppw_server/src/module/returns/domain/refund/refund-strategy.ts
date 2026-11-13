export type RefundOrderItem = {
  id: string;
  unitPriceCents: bigint;
  quantity: number;
};

export type ReturnQuantity = {
  orderItemId: string;
  quantity: number;
};

export type RefundCalculationInput = {
  itemsTotalCents: bigint;
  couponDiscountCents: bigint;
  shippingPaidCents: bigint;
  amountPaidCents: bigint;
  amountAlreadyRefundedCents: bigint;
  orderItems: readonly RefundOrderItem[];
  previouslyReturnedItems: readonly ReturnQuantity[];
  requestedItems: readonly ReturnQuantity[];
};

export interface RefundStrategy {
  calculate(input: RefundCalculationInput): bigint;
}
