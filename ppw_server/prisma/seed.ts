import { config } from 'dotenv';
import { resolve } from 'path';
import { hash } from 'bcryptjs';
import { PrismaClient, Role } from '@prisma/client';

config({ path: resolve(__dirname, '..', '..', '.env') });

const prisma = new PrismaClient();
const users = [
  { email: 'customer@returns.local', password: 'Customer123!', role: Role.CUSTOMER },
  { email: 'inspector@returns.local', password: 'Inspector123!', role: Role.INSPECTOR },
  { email: 'finance@returns.local', password: 'Finance123!', role: Role.FINANCE },
  { email: 'admin@returns.local', password: 'Admin123!', role: Role.ADMIN },
];

async function seed(): Promise<void> {
  for (const user of users) {
    const passwordHash = await hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: { passwordHash, role: user.role },
      create: { email: user.email, passwordHash, role: user.role },
    });
  }
}

void seed().finally(() => prisma.$disconnect());
