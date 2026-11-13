import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { AuthenticatedUser } from './auth.types';

type TokenPayload = {
  sub: string;
  role: Role;
  exp: number;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const authorization = request.headers.authorization;
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : null;
    if (!token) throw new UnauthorizedException('Bearer token is required');

    const [headerPart, payloadPart, signaturePart, extraPart] = token.split('.');
    if (!headerPart || !payloadPart || !signaturePart || extraPart !== undefined) {
      throw new UnauthorizedException('Invalid token');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new UnauthorizedException('JWT authentication is not configured');

    const expectedSignature = createHmac('sha256', secret)
      .update(`${headerPart}.${payloadPart}`)
      .digest();
    const actualSignature = Buffer.from(signaturePart, 'base64url');
    if (
      actualSignature.length !== expectedSignature.length ||
      !timingSafeEqual(actualSignature, expectedSignature)
    ) {
      throw new UnauthorizedException('Invalid token');
    }

    const header = this.parseJson(headerPart);
    if (!header || typeof header !== 'object' || (header as { alg?: unknown }).alg !== 'HS256') {
      throw new UnauthorizedException('Invalid token');
    }

    const payload = this.parseJson(payloadPart);
    if (!this.isTokenPayload(payload) || payload.exp <= Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    request.user = { id: payload.sub, role: payload.role };
    return true;
  }

  private parseJson(part: string): unknown {
    try {
      return JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as unknown;
    } catch (error) {
      if (error instanceof SyntaxError) throw new UnauthorizedException('Invalid token');
      throw error;
    }
  }

  private isTokenPayload(value: unknown): value is TokenPayload {
    if (!value || typeof value !== 'object') return false;
    const payload = value as Record<string, unknown>;
    return (
      typeof payload.sub === 'string' &&
      typeof payload.exp === 'number' &&
      Object.values(Role).includes(payload.role as Role)
    );
  }
}
