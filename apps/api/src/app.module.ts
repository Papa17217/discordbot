// ============================================
// Root Application Module
// ============================================

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { GuildsModule } from './modules/guilds/guilds.module';
import { ConfigManagerModule } from './modules/config/config.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { EconomyModule } from './modules/economy/economy.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PremiumModule } from './modules/premium/premium.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { WebSocketModule } from './modules/websocket/websocket.module';
import { BotModule } from './modules/bot/bot.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    // ── Configuration ──────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
    }),

    // ── Rate Limiting ──────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // ── Infrastructure ─────────────────────────
    PrismaModule,
    RedisModule,

    // ── Feature Modules ────────────────────────
    AuthModule,
    UsersModule,
    GuildsModule,
    ConfigManagerModule,
    ModerationModule,
    EconomyModule,
    TicketsModule,
    AnalyticsModule,
    PremiumModule,
    AdminModule,
    HealthModule,
    WebSocketModule,
    BotModule,
  ],
  providers: [
    // Global JWT Guard — wszystkie endpointy wymagają auth
    // chyba że oznaczone @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
