import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { BotService, type BotType } from '../bot/bot.service';

@Injectable()
export class GuildsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private configService: ConfigService,
    private botService: BotService,
  ) {}

  // ── Pobierz serwery użytkownika z Discord API ──

  async getUserGuilds(userId: string, userDiscordId: string, bot: BotType = 'private') {
    const accessToken = await this.redis.get(`discord_token:${userId}`);
    if (!accessToken) throw new UnauthorizedException('Sesja wygasła. Zaloguj się ponownie.');

    let discordGuilds: any[] = [];
    try {
      const res = await fetch('https://discord.com/api/users/@me/guilds', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error('API Error');
      discordGuilds = (await res.json()) as any[];
    } catch (err) {
      throw new UnauthorizedException('Nie udało się pobrać serwerów z Discorda. Przeloguj się.');
    }

    // Filtruj serwery po uprawnieniach MANAGE_GUILD (0x20) lub ADMINISTRATOR (0x8)
    const adminGuilds = discordGuilds.filter((g) => {
      const permissions = BigInt(g.permissions);
      return (permissions & 0x20n) === 0x20n || (permissions & 0x8n) === 0x8n;
    });

    // Pobierz guildy z bazy które bot ma
    const [botGuilds, managedGuilds] = await Promise.all([
      this.prisma.guild.findMany({
        select: { discordId: true, id: true, memberCount: true, premium: true },
        where: { botType: bot.toUpperCase() as any },
      }),
      this.botService.getManagedGuilds(bot),
    ]);

    const activeBotGuildIds = new Set(managedGuilds.map((guild) => guild.id));
    const activeBotLabel = bot === 'public' ? 'PUBLIC' : 'PRIVATE';
    
    // Zbuduj mapę serwerów z naszej bazy danych (do pobrania wewnętrznego id bazy)
    const dbGuildMap = new Map();
    for (const bg of botGuilds) {
      dbGuildMap.set(bg.discordId, bg);
    }

    return adminGuilds.map((guild) => {
      const dbGuild = dbGuildMap.get(guild.id);
      return {
        id: dbGuild ? dbGuild.id : guild.id,
        discordId: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount: dbGuild ? dbGuild.memberCount : 0,
        premium: dbGuild ? dbGuild.premium : false,
        botPresent: activeBotGuildIds.has(guild.id),
        activeBotPresent: activeBotGuildIds.has(guild.id),
        availableBots: activeBotGuildIds.has(guild.id) ? [activeBotLabel] : [],
        userPermissions: guild.permissions,
      };
    });
  }

  // ── Pobierz szczegóły guildu ──

  async getGuild(guildId: string, userDiscordId: string) {
    const cached = await this.redis.getJson(`guild:${guildId}`);
    if (cached) return cached;

    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      include: {
        config: true,
        welcomeConfig: true,
        economyConfig: true,
        levelConfig: true,
        ticketConfig: true,
        _count: {
          select: {
            members: true,
            moderationLogs: true,
            tickets: { where: { status: 'OPEN' } },
            transactions: true,
          },
        },
      },
    });

    if (!guild) throw new NotFoundException('Serwer nie znaleziony');

    await this.redis.setJson(`guild:${guildId}`, guild, 60);
    return guild;
  }

  // ── Pobierz lub utwórz guild ──

  async findOrCreateGuild(discordId: string, name: string, icon: string | null, ownerId: string, bot: BotType = 'private') {
    const botTypeEnum = bot.toUpperCase() as any;
    let guild = await this.prisma.guild.findUnique({
      where: { discordId_botType: { discordId, botType: botTypeEnum } },
    });

    if (!guild) {
      guild = await this.prisma.guild.create({
        data: {
          discordId,
          name,
          icon,
          ownerId,
          botType: botTypeEnum,
          config: {
            create: {},
          },
        },
        include: { config: true },
      });
    } else {
      guild = await this.prisma.guild.update({
        where: { discordId_botType: { discordId, botType: botTypeEnum } },
        data: { name, icon },
      });
    }

    return guild;
  }

  // ── Aktualizuj guild ──

  async updateGuild(guildId: string, data: Partial<{ name: string; icon: string; memberCount: number }>) {
    const guild = await this.prisma.guild.update({
      where: { id: guildId },
      data,
    });
    await this.redis.del(`guild:${guildId}`);
    return guild;
  }

  // ── Usuń guild ──

  async removeGuild(discordId: string, bot: BotType = 'private') {
    const botTypeEnum = bot.toUpperCase() as any;
    const guild = await this.prisma.guild.findUnique({ where: { discordId_botType: { discordId, botType: botTypeEnum } } });
    if (guild) {
      await this.prisma.guild.delete({ where: { discordId_botType: { discordId, botType: botTypeEnum } } });
      await this.redis.del(`guild:${guild.id}`);
    }
  }

  // ── Statystyki guild ──

  async getGuildStats(guildId: string) {
    const cacheKey = `guild:stats:${guildId}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
    });

    if (!guild) throw new NotFoundException('Serwer nie znaleziony');

    const [memberCount, modLogs, openTickets, totalCommands, recentActions] = await Promise.all([
      this.prisma.guildMember.count({ where: { guildId } }),
      this.prisma.moderationLog.count({ where: { guildId } }),
      this.prisma.ticket.count({ where: { guildId, status: 'OPEN' } }),
      this.prisma.commandUsage.count({ where: { guildId } }),
      this.prisma.moderationLog.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          moderator: { select: { username: true, avatar: true } },
          target: { select: { username: true, avatar: true } },
        },
      }),
    ]);

    const stats = {
      totalMembers: guild.memberCount || memberCount,
      totalModerations: modLogs,
      openTickets,
      totalCommands,
      recentActions,
    };

    await this.redis.setJson(cacheKey, stats, 60);
    return stats;
  }

  async getChannels(guildId: string, bot: BotType = 'private') {
    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      select: { discordId: true },
    });
    if (!guild) throw new NotFoundException('Serwer nie znaleziony');
    return this.botService.getGuildChannels(guild.discordId, bot);
  }

  async getRoles(guildId: string, bot: BotType = 'private') {
    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      select: { discordId: true },
    });
    if (!guild) throw new NotFoundException('Serwer nie znaleziony');
    return this.botService.getGuildRoles(guild.discordId, bot);
  }
}
