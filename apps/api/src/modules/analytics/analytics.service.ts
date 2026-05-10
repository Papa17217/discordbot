import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getOverview(guildId: string) {
    const cacheKey = `analytics:overview:${guildId}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalMembers,
      totalCommands,
      totalModerations,
      commandsThisWeek,
      moderationsThisWeek,
      topCommands,
      recentEvents,
    ] = await Promise.all([
      this.prisma.guildMember.count({ where: { guildId } }),
      this.prisma.commandUsage.count({ where: { guildId } }),
      this.prisma.moderationLog.count({ where: { guildId } }),
      this.prisma.commandUsage.count({ where: { guildId, createdAt: { gte: weekAgo } } }),
      this.prisma.moderationLog.count({ where: { guildId, createdAt: { gte: weekAgo } } }),
      this.prisma.commandUsage.groupBy({
        by: ['commandName'],
        where: { guildId, createdAt: { gte: monthAgo } },
        _count: { commandName: true },
        orderBy: { _count: { commandName: 'desc' } },
        take: 10,
      }),
      this.prisma.analyticsEvent.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    const overview = {
      totalMembers,
      totalCommands,
      totalModerations,
      commandsThisWeek,
      moderationsThisWeek,
      topCommands: topCommands.map((c) => ({
        command: c.commandName,
        count: c._count.commandName,
      })),
      recentEvents,
    };

    await this.redis.setJson(cacheKey, overview, 120);
    return overview;
  }

  async getCommandStats(guildId: string, days = 7) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const stats = await this.prisma.commandUsage.groupBy({
      by: ['commandName'],
      where: { guildId, createdAt: { gte: since } },
      _count: { commandName: true },
      orderBy: { _count: { commandName: 'desc' } },
    });

    return stats.map((s) => ({ command: s.commandName, count: s._count.commandName }));
  }

  async getMemberGrowth(guildId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const events = await this.prisma.analyticsEvent.findMany({
      where: {
        guildId,
        type: { in: ['MEMBER_JOIN', 'MEMBER_LEAVE'] },
        createdAt: { gte: since },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Agreguj po dniach
    const dailyData: Record<string, { joins: number; leaves: number }> = {};
    events.forEach((e) => {
      const day = e.createdAt.toISOString().split('T')[0];
      if (!dailyData[day]) dailyData[day] = { joins: 0, leaves: 0 };
      if (e.type === 'MEMBER_JOIN') dailyData[day].joins++;
      else dailyData[day].leaves++;
    });

    return Object.entries(dailyData).map(([date, data]) => ({ date, ...data }));
  }

  async trackEvent(guildId: string, type: string, data: any = {}) {
    await this.prisma.analyticsEvent.create({
      data: { guildId, type, data },
    });
  }

  async trackCommand(guildId: string, commandName: string, userId: string) {
    await this.prisma.commandUsage.create({
      data: { guildId, commandName, userId },
    });
  }
}
