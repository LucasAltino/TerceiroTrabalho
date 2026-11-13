import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import {
  DomainError,
  InvalidTransitionError,
  PayloadValidationError,
  PermissionDeniedError,
  VersionConflictError,
} from '../../module/returns/domain/errors';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse();
    const status = this.statusFor(exception);
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: HttpStatus[status],
    });
  }

  private statusFor(exception: DomainError): number {
    if (exception instanceof VersionConflictError) return HttpStatus.CONFLICT;
    if (exception instanceof PermissionDeniedError) return HttpStatus.FORBIDDEN;
    if (exception instanceof InvalidTransitionError || exception instanceof PayloadValidationError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
