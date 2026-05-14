import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Delete,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../prisma/prisma.service';
import { BotService } from '../bot/bot.service';
import { Roles, Public, CurrentUser } from '../../common/decorators';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, BotType } from '@prisma/client';
import { EventsGateway } from '../websocket/events.gateway';
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
    console.log('📥 Otrzymano log z bota:', log.message);
    // Weryfikacja — akceptujemy tokeny obu botów
    const privateToken = this.config.get('DISCORD_TOKEN');
    const publicToken = this.config.get('DISCORD_TOKEN_PUBLIC');
    if (token !== privateToken && token !== publicToken) {
      throw new UnauthorizedException('Błędny token bota');
    }

    this.eventsGateway.emitLog(log);
    return { success: true };
  }


  @Get('users')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
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
        botWhitelist: {
          select: {
            botType: true,
          },
        },
      },
    });
  }

  @Patch('users/:id/role')
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
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
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pobierz statystyki globalne platformy' })
  async getGlobalStats() {
    const [userCount, guildCount, ticketCount, botsStatus] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.guild.count(),
      this.prisma.ticket.count(),
      this.botService.getAllBotsStatus(),
    ]);

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
      bot: botsStatus.private,
      bots: botsStatus,
      recentActions: recentTickets.map(t => ({
        action: 'TICKET_OPEN',
        user: t.user.username,
        mod: 'System',
        time: t.createdAt,
        color: 'text-blue-400'
      }))
    };
  }


  @Get('config')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pobierz ustawienia globalne' })
  async getGlobalConfig() {
    return this.prisma.globalConfig.findMany();
  }

  @Patch('config')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Zaktualizuj ustawienia globalne' })
  async updateGlobalConfig(
    @Body() config: { key: string, value: string, description?: string }[]
  ) {
    const upserts = config.map(c => 
      this.prisma.globalConfig.upsert({
        where: { key: c.key },
        update: { value: c.value, description: c.description },
        create: { key: c.key, value: c.value, description: c.description },
      })
    );
    await Promise.all(upserts);
    return { success: true };
  }

  // ══════════════════════════════════════════
  // WHITELIST MANAGEMENT
  // ══════════════════════════════════════════

  @Get('whitelist')
  @Roles(Role.OWNER, Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Pobierz whitelistę (opcjonalnie per bot)' })
  async getWhitelist(@Query('bot') bot?: string) {
    const where = bot ? { botType: bot as BotType } : {};
    return this.prisma.botWhitelist.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            discordId: true,
            username: true,
            avatar: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('whitelist')
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Dodaj użytkownika do whitelisty' })
  async addToWhitelist(
    @Body() body: { userId: string; botType: BotType },
    @CurrentUser('discordId') addedBy: string,
  ) {
    return this.prisma.botWhitelist.upsert({
      where: {
        userId_botType: {
          userId: body.userId,
          botType: body.botType,
        },
      },
      update: {},
      create: {
        userId: body.userId,
        botType: body.botType,
        addedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            discordId: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
  }

  @Delete('whitelist/:userId/:botType')
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Usuń użytkownika z whitelisty' })
  async removeFromWhitelist(
    @Param('userId') userId: string,
    @Param('botType') botType: BotType,
  ) {
    await this.prisma.botWhitelist.delete({
      where: {
        userId_botType: {
          userId,
          botType,
        },
      },
    });
    return { success: true };
  }

  @Post('whitelist/bulk')
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Masowe dodanie/usunięcie whitelisty' })
  async bulkWhitelist(
    @Body() body: { userId: string; botType: BotType; action: 'add' | 'remove' }[],
    @CurrentUser('discordId') addedBy: string,
  ) {
    const results = [];
    for (const item of body) {
      if (item.action === 'add') {
        const result = await this.prisma.botWhitelist.upsert({
          where: {
            userId_botType: {
              userId: item.userId,
              botType: item.botType,
            },
          },
          update: {},
          create: {
            userId: item.userId,
            botType: item.botType,
            addedBy,
          },
        });
        results.push(result);
      } else {
        try {
          await this.prisma.botWhitelist.delete({
            where: {
              userId_botType: {
                userId: item.userId,
                botType: item.botType,
              },
            },
          });
        } catch {}
      }
    }
    return { success: true, count: results.length };
  }
}
