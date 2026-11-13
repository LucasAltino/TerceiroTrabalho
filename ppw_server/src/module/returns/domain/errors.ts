export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidTransitionError extends DomainError {}
export class PayloadValidationError extends DomainError {}
export class VersionConflictError extends DomainError {}
export class PermissionDeniedError extends DomainError {}
