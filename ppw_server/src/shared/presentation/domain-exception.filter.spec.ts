import { ArgumentsHost } from '@nestjs/common';
import { VersionConflictError } from '../../module/returns/domain/errors';
import { DomainExceptionFilter } from './domain-exception.filter';

describe('DomainExceptionFilter', () => {
  it('maps a version conflict to HTTP 409', () => {
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

    new DomainExceptionFilter().catch(new VersionConflictError('conflict'), host);

    expect(response.status).toHaveBeenCalledWith(409);
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 409, message: 'conflict' }),
    );
  });
});
