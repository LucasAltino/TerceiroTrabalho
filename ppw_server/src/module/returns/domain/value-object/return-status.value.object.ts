export enum ReturnStatusValue {
  REQUESTED = 'REQUESTED',
  POSTED = 'POSTED',
  RECEIVED = 'RECEIVED',
  INSPECTING = 'INSPECTING',
  ADJUSTMENT_REQUESTED = 'ADJUSTMENT_REQUESTED',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export class ReturnStatus {
  private constructor(private readonly valor: ReturnStatusValue) {}

  static from(value: string): ReturnStatus {
    if (!Object.values(ReturnStatusValue).includes(value as ReturnStatusValue)) {
      throw new Error(`Invalid return status: ${value}`);
    }
    return new ReturnStatus(value as ReturnStatusValue);
  }

  getValue(): ReturnStatusValue {
    return this.valor;
  }
}
