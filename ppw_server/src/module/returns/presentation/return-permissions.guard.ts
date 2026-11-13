import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { PermissionDeniedError } from '../domain/errors';
import { TRANSITION_RULES } from '../domain/transition/return-transition-rules';
import { AuthenticatedRequest, AuthenticatedUser } from '../../auth/auth.types';
import { ReturnAction } from '../application/use-case/return-request.usecases';

const RETURN_ACTION_METADATA = 'return_action';

export const RETURN_ACTION_PERMISSIONS: Record<Role, readonly ReturnAction[]> = {
  CUSTOMER: ['create', 'list', 'read', 'update', 'post', 'cancel'],
  INSPECTOR: ['list', 'read', 'receive', 'startInspection', 'requestAdjustment', 'approve', 'reject'],
  FINANCE: ['list', 'read', 'complete', 'cancel'],
  ADMIN: ['create', 'list', 'read', 'update', ...Object.keys(TRANSITION_RULES) as ReturnAction[]],
};

export const RequireReturnAction = (action: ReturnAction) =>
  SetMetadata(RETURN_ACTION_METADATA, action);

@Injectable()
export class ReturnPermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const action = this.reflector.getAllAndOverride<ReturnAction>(RETURN_ACTION_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!action) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as AuthenticatedUser | undefined;
    if (!user || !RETURN_ACTION_PERMISSIONS[user.role]?.includes(action)) {
      throw new PermissionDeniedError('Role is not allowed to perform this action');
    }

    const returnId = request.params.id;
    if (user.role === Role.CUSTOMER && returnId !== undefined) {
      if (typeof returnId !== 'string') {
        throw new PermissionDeniedError('Customers may only act on their own returns');
      }
      const returnRequest = await this.prisma.returnRequest.findUnique({
        where: { id: returnId },
        select: { customerId: true },
      });
      if (returnRequest?.customerId !== user.id) {
        throw new PermissionDeniedError('Customers may only act on their own returns');
      }
    }

    return true;
  }
}
