// ============================================
// API Entry Point — Bootstrap
// ============================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ── Security ───────────────────────────────
  app.use(helmet());
  app.use(cookieParser());

  // ── CORS ───────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Global Validation ──────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── API Prefix ─────────────────────────────
  app.setGlobalPrefix('api', {
    exclude: ['health'],
  });

  // ── Swagger ────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Discord SaaS API')
      .setDescription('API do zarządzania botem Discord')
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('auth', 'Autoryzacja Discord OAuth2')
      .addTag('users', 'Zarządzanie użytkownikami')
      .addTag('guilds', 'Zarządzanie serwerami')
      .addTag('config', 'Konfiguracja serwerów')
      .addTag('moderation', 'Moderacja')
      .addTag('economy', 'Ekonomia')
      .addTag('tickets', 'Tickety')
      .addTag('analytics', 'Analityka')
      .addTag('premium', 'Premium')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // ── Graceful Shutdown ──────────────────────
  app.enableShutdownHooks();

  const port = process.env.API_PORT || 4000;
  await app.listen(port);

  console.log(`🚀 API działa na: http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
}

bootstrap();
