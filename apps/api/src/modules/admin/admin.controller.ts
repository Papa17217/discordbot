import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { BotService } from '../bot/bot.service';
import { Roles, Public } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';
import { EventsGateway } from '../websocket/events.gateway';
import { Post, Headers, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(
    private prisma: PrismaService,
    private botService: BotService,
    private eventsGateway: EventsGateway,
    private config: ConfigService,
  ) {}

  @Public()
  @Post('logs')
  @ApiOperation({ summary: 'Przyjmij logi z bota (tylko dla bota)' })
  async ingestLogs(

    @Body() log: { level: string; message: string; timestamp: string },
    @Headers('x-bot-token') token: string,
  ) {
    // Prosta weryfikacja czy to na pewno bot
    if (token !== this.config.get('DISCORD_TOKEN')) {
      throw new UnauthorizedException('Błędny token bota');
    }

    this.eventsGateway.emitLog(log);
    return { success: true };
  }


  @Get('users')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Pobierz listę wszystkich użytkowników' })
  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        discordId: true,
        username: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });
  }

  @Patch('users/:id/role')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Zmień rolę użytkownika (tylko dla OWNER)' })
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: Role,
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
  }

  @Get('stats')
  @Roles(Role.OWNER, Role.ADMIN)
  @ApiOperation({ summary: 'Pobierz statystyki globalne platformy' })
  async getGlobalStats() {
    const [userCount, guildCount, ticketCount, botStatus] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.guild.count(),
      this.prisma.ticket.count(),
      this.botService.getBotStatus(),
    ]);

    // Pobierz ostatnie akcje (np. ostatnie utworzone tickety)
    const recentTickets = await this.prisma.ticket.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    return {
      users: userCount,
      guilds: guildCount,
      tickets: ticketCount,
      bot: botStatus,
      recentActions: recentTickets.map(t => ({
        action: 'TICKET_OPEN',
        user: t.user.username,
        mod: 'System',
        time: t.createdAt,
        color: 'text-blue-400'
      }))
    };
  }
}
