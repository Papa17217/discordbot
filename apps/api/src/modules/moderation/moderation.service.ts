import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ModerationService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getLogs(guildId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.moderationLog.findMany({
        where: { guildId },
        include: {
          moderator: { select: { username: true, avatar: true, discordId: true } },
          target: { select: { username: true, avatar: true, discordId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.moderationLog.count({ where: { guildId } }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async createLog(data: {
    guildId: string;
    moderatorId: string;
    targetId: string;
    action: any;
    reason?: string;
    duration?: number;
  }) {
    const log = await this.prisma.moderationLog.create({
      data: {
        guildId: data.guildId,
        moderatorId: data.moderatorId,
        targetId: data.targetId,
        action: data.action,
        reason: data.reason,
        duration: data.duration,
        expiresAt: data.duration ? new Date(Date.now() + data.duration) : null,
      },
      include: {
        moderator: { select: { username: true } },
        target: { select: { username: true } },
      },
    });

    await this.redis.del(`guild:stats:${data.guildId}`);
    return log;
  }

  async getWarnings(guildId: string, userId?: string) {
    return this.prisma.warning.findMany({
      where: { guildId, ...(userId && { userId }) },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addWarning(guildId: string, userId: string, moderatorId: string, reason: string) {
    const warning = await this.prisma.warning.create({
      data: { guildId, userId, moderatorId, reason },
    });

    // Inkrementuj licznik ostrzeżeń na memberze
    await this.prisma.guildMember.updateMany({
      where: { guildId, userId },
      data: { warnings: { increment: 1 } },
    });

    return warning;
  }

  async clearWarnings(guildId: string, userId: string) {
    await this.prisma.warning.deleteMany({ where: { guildId, userId } });
    await this.prisma.guildMember.updateMany({
      where: { guildId, userId },
      data: { warnings: 0 },
    });
  }
}
