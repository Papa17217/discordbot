// ============================================
// Auth Controller — OAuth2 & Token Endpoints
// ============================================

import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { Public, CurrentUser } from '../../common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  // ── Discord OAuth2 Login ───────────────────

  @Public()
  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Rozpocznij logowanie przez Discord' })
  discordLogin() {
    // Passport automatycznie przekieruje do Discord
  }

  // ── Discord OAuth2 Callback ────────────────

  @Public()
  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Callback po zalogowaniu Discord' })
  async discordCallback(@Req() req: Request, @Res() res: Response) {
    const tokens = await this.authService.validateDiscordUser(req.user as any);

    // Ustaw refresh token jako HttpOnly cookie
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dni
      path: '/api/auth',
    });

    // Przekieruj do frontend z access token
    const frontendUrl = this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    res.redirect(`${frontendUrl}/auth/callback?token=${tokens.accessToken}`);
  }

  // ── Refresh Token ──────────────────────────

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Odśwież access token' })
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Brak refresh token',
      });
    }

    const tokens = await this.authService.refreshTokens(refreshToken);

    // Zaktualizuj cookie
    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/api/auth',
    });

    return res.json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      timestamp: new Date().toISOString(),
    });
  }

  // ── Logout ─────────────────────────────────

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Wyloguj się' })
  async logout(@CurrentUser('id') userId: string, @Res() res: Response) {
    await this.authService.logout(userId);

    res.clearCookie('refresh_token', { path: '/api/auth' });

    return res.json({
      success: true,
      message: 'Wylogowano pomyślnie',
      timestamp: new Date().toISOString(),
    });
  }

  // ── Current User ───────────────────────────

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Pobierz profil zalogowanego użytkownika' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.authService.getUser(userId);

    return {
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    };
  }
}
