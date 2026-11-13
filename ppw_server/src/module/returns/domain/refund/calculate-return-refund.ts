import { PayloadValidationError } from '../errors';
import { RefundCalculationInput, RefundStrategy } from './refund-strategy';

export type ReturnType = 'DEVOLUTION' | 'EXCHANGE';

export function calculateReturnRefund(
  returnType: ReturnType,
  strategy: RefundStrategy,
  input: RefundCalculationInput,
): bigint {
  if (returnType === 'EXCHANGE') return 0n;

  const amount = strategy.calculate(input);
  const maximum = input.amountPaidCents - input.amountAlreadyRefundedCents;
  if (amount < 0n || maximum < 0n || amount > maximum) {
    throw new PayloadValidationError('Refund strategy exceeded the remaining paid amount');
  }
  return amount;
}
