// ============================================
// Discord OAuth2 Strategy
// ============================================

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('DISCORD_CLIENT_ID')!,
      clientSecret: configService.get<string>('DISCORD_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('DISCORD_CALLBACK_URL', 'http://localhost:4000/api/auth/discord/callback')!,
      scope: ['identify', 'email', 'guilds'],
    } as any);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ) {
    return {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator || '0',
      avatar: profile.avatar,
      email: profile.email,
      accessToken,
      refreshToken,
    };
  }
}
