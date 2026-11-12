export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

export class Status {
  private readonly value: TicketStatus;

  private constructor(value: TicketStatus) {
    this.value = value;
  }

  static from(value?: string | null): Status {
    const normalized = (value ?? 'open').trim().toLowerCase();

    switch (normalized) {
      case 'in_progress':
      case 'in-progress':
        return new Status(TicketStatus.IN_PROGRESS);
      case 'closed':
      case 'concluido':
      case 'concluida':
        return new Status(TicketStatus.CLOSED);
      case 'open':
      case 'aberto':
      default:
        return new Status(TicketStatus.OPEN);
    }
  }

  getValue(): TicketStatus {
    return this.value;
  }
}
