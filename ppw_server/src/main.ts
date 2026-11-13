import { NestFactory } from '@nestjs/core';
import { config } from 'dotenv';
import { resolve } from 'path';
import { AppModule } from './app/app.module';

config({ path: resolve(__dirname, '..', '..', '.env') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Allow CORS for local Next.js dev server during development
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    methods: 'POST, GET, PUT, PATCH, DELETE',
    allowedHeaders:
      'Content-Type, Authorization, Accept, X-Requested-With, X-HTTP-Method-Override, X-Access-Token, X-Key, X-User-Agent',
    credentials: false,
  });
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
