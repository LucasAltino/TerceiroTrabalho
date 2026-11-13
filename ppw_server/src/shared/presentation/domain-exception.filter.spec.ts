import { ArgumentsHost } from '@nestjs/common';
import {
  InvalidTransitionError,
  PayloadValidationError,
  PermissionDeniedError,
  VersionConflictError,
} from '../../module/returns/domain/errors';
import { DomainExceptionFilter } from './domain-exception.filter';

describe('DomainExceptionFilter', () => {
  function apply(exception: VersionConflictError | PermissionDeniedError | InvalidTransitionError | PayloadValidationError) {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const host: ArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({ getResponse: () => response }),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      getType: jest.fn(),
    };

    new DomainExceptionFilter().catch(exception, host);
    return response;
  }

  it('maps a version conflict to HTTP 409', () => {
    expect(apply(new VersionConflictError('conflict')).status).toHaveBeenCalledWith(409);
  });

  it('maps permission errors to HTTP 403', () => {
    expect(apply(new PermissionDeniedError('forbidden')).status).toHaveBeenCalledWith(403);
  });

  it.each([new InvalidTransitionError('invalid'), new PayloadValidationError('invalid payload')])(
    'maps invalid domain input to HTTP 422',
    (exception) => {
      expect(apply(exception).status).toHaveBeenCalledWith(422);
    },
  );

  it('returns the domain error message in the response body', () => {
    expect(apply(new VersionConflictError('conflict')).json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, message: 'conflict' }),
    );
  });
});
