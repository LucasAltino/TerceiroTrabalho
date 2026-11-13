import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('returns a signed token for valid credentials', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const passwordHash = await hash('correct-password', 1);
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'user-1',
          role: Role.CUSTOMER,
          passwordHash,
        }),
      },
    } as unknown as PrismaService;
    const service = new AuthService(prisma);

    const result = await service.login({ email: ' CUSTOMER@example.com ', password: 'correct-password' });

    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'customer@example.com' },
    });
  });
});
