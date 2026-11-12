export enum NivelPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class Priority {
  private readonly value: NivelPriority;

  private constructor(value: NivelPriority) {
    this.value = value;
  }

  static from(value?: string | null): Priority {
    const normalized = (value ?? 'MEDIUM').trim().toUpperCase();

    switch (normalized) {
      case 'LOW':
      case 'BAIXA':
        return new Priority(NivelPriority.LOW);
      case 'MEDIUM':
      case 'MEDIA':
        return new Priority(NivelPriority.MEDIUM);
      case 'HIGH':
      case 'ALTA':
        return new Priority(NivelPriority.HIGH);
      default:
        return new Priority(NivelPriority.MEDIUM);
    }
  }

  getValue(): NivelPriority {
    return this.value;
  }
}
