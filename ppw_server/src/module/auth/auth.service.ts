import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import { compare } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

export type LoginDto = {
  email: string;
  password: string;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(credentials: LoginDto): Promise<{ accessToken: string }> {
    if (typeof credentials.email !== 'string' || typeof credentials.password !== 'string') {
      throw new UnauthorizedException('Invalid email or password');
    }
    const email = credentials.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !(await compare(credentials.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return { accessToken: this.signToken(user.id, user.role) };
  }

  private signToken(userId: string, role: Role): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new InternalServerErrorException('JWT_SECRET is not configured');

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,
        jti: randomUUID(),
      }),
    ).toString('base64url');
    const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
    return `${header}.${payload}.${signature}`;
  }
}
