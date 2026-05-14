// ============================================
// Auth Service — Login, Token Management
// ============================================

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { Role } from '@prisma/client';
import type { IAuthTokens, IAuthUser, IDiscordOAuthUser } from '@discord-saas/types';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  // ── Discord OAuth2 Callback ────────────────

  async validateDiscordUser(discordUser: IDiscordOAuthUser): Promise<IAuthTokens> {
    // Znajdź lub utwórz użytkownika
    let user = await this.prisma.user.findUnique({
      where: { discordId: discordUser.id },
    });

    // Automatycznie nadaj OWNER dla twórcy platformy
    const isOwner = discordUser.username === '.papa1312' || discordUser.id === '686341030240321566';
    const targetRole = isOwner ? Role.OWNER : (user?.role || Role.USER);

    if (user) {
      // Aktualizuj dane
      user = await this.prisma.user.update({
        where: { discordId: discordUser.id },
        data: {
          username: discordUser.username,
          avatar: discordUser.avatar,
          email: discordUser.email,
          role: targetRole,
        },
      });
    } else {
      // Utwórz nowego użytkownika
      user = await this.prisma.user.create({
        data: {
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator || '0',
          avatar: discordUser.avatar,
          email: discordUser.email,
          role: targetRole,
        },
      });
    }

    // Wygeneruj tokeny
    const tokens = await this.generateTokens({
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      role: user.role as any,
      subscription: user.subscription as any,
    });

    // Zapisz refresh token w bazie
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refreshToken },
    });

    // Zapisz accessToken z Discorda w Redis (przydatny m.in do pobierania serwerów z API Discord)
    await this.redis.set(`discord_token:${user.id}`, discordUser.accessToken, 86400 * 7); // 7 dni

    return tokens;
  }

  // ── Token Generation ───────────────────────

  async generateTokens(user: IAuthUser): Promise<IAuthTokens> {
    const payload = {
      sub: user.id,
      discordId: user.discordId,
      username: user.username,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRATION', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minut w sekundach
    };
  }

  // ── Token Refresh ──────────────────────────

  async refreshTokens(refreshToken: string): Promise<IAuthTokens> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.refreshToken !== refreshToken) {
        throw new UnauthorizedException('Nieprawidłowy refresh token');
      }

      const tokens = await this.generateTokens({
        id: user.id,
        discordId: user.discordId,
        username: user.username,
        avatar: user.avatar,
        role: user.role as any,
        subscription: user.subscription as any,
      });

      // Aktualizuj refresh token
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: tokens.refreshToken },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Nieprawidłowy lub wygasły refresh token');
    }
  }

  // ── Logout ─────────────────────────────────

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    // Wyczyść cache
    await this.redis.del(`user:${userId}`);
  }

  // ── Get User ───────────────────────────────

  async getUser(userId: string): Promise<IAuthUser | null> {
    // Sprawdź cache
    const cached = await this.redis.getJson<IAuthUser>(`user:${userId}`);
    if (cached) return cached;

    let user: any = null;

    try {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          botWhitelist: {
            select: { botType: true },
          },
        },
      });
    } catch {
      user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
    }

    if (!user) return null;

    const whitelist = Array.isArray(user.botWhitelist)
      ? user.botWhitelist.map((w: { botType: string }) => w.botType)
      : [];

    const authUser: IAuthUser & { whitelist?: string[] } = {
      id: user.id,
      discordId: user.discordId,
      username: user.username,
      avatar: user.avatar,
      role: user.role as any,
      subscription: user.subscription as any,
      whitelist,
    };

    // Cache na 2 minuty
    await this.redis.setJson(`user:${userId}`, authUser, 120);

    return authUser;
  }
}
