import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionDeniedError } from '../domain/errors';
import { AuthenticatedRequest } from '../../auth/auth.types';
import { ReturnPermissionsGuard } from './return-permissions.guard';

function contextFor(request: Partial<AuthenticatedRequest>): ExecutionContext {
  return {
    getClass: jest.fn(),
    getHandler: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({ getRequest: () => request }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getType: jest.fn(),
  };
}

describe('ReturnPermissionsGuard', () => {
  it('allows a customer to post their own return', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('post');
    const prisma = {
      returnRequest: { findUnique: jest.fn().mockResolvedValue({ customerId: 'customer-1' }) },
    } as unknown as PrismaService;
    const guard = new ReturnPermissionsGuard(reflector, prisma);
    const context = contextFor({
      user: { id: 'customer-1', role: Role.CUSTOMER },
      params: { id: 'return-1' },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects a customer attempting to act on another customer return', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('cancel');
    const prisma = {
      returnRequest: { findUnique: jest.fn().mockResolvedValue({ customerId: 'other-customer' }) },
    } as unknown as PrismaService;
    const guard = new ReturnPermissionsGuard(reflector, prisma);
    const context = contextFor({
      user: { id: 'customer-1', role: Role.CUSTOMER },
      params: { id: 'return-1' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PermissionDeniedError);
  });

  it('rejects a role that is not listed for the action', async () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue('approve');
    const prisma = { returnRequest: { findUnique: jest.fn() } } as unknown as PrismaService;
    const guard = new ReturnPermissionsGuard(reflector, prisma);
    const context = contextFor({
      user: { id: 'customer-1', role: Role.CUSTOMER },
      params: { id: 'return-1' },
    });

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(prisma.returnRequest.findUnique).not.toHaveBeenCalled();
  });
});
