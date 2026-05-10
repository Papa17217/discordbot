import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class ConfigManagerService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async getGuildConfig(guildId: string) {
    const cached = await this.redis.getJson(`config:${guildId}`);
    if (cached) return cached;

    const config = await this.prisma.guildConfig.findUnique({
      where: { guildId },
    });

    if (!config) throw new NotFoundException('Konfiguracja nie znaleziona');

    await this.redis.setJson(`config:${guildId}`, config, 300);
    return config;
  }

  async getGuildById(id: string) {
    return this.prisma.guild.findUnique({ where: { id } });
  }

  async updateGuildConfig(guildId: string, data: any) {
    const config = await this.prisma.guildConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });

    await this.redis.del(`config:${guildId}`);
    await this.redis.del(`guild:${guildId}`);
    return config;
  }

  async getWelcomeConfig(guildId: string) {
    return this.prisma.welcomeConfig.findUnique({ where: { guildId } });
  }

  async updateWelcomeConfig(guildId: string, data: any) {
    const config = await this.prisma.welcomeConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });
    await this.redis.del(`welcome:${guildId}`);
    return config;
  }

  async getEconomyConfig(guildId: string) {
    return this.prisma.economyConfig.findUnique({ where: { guildId } });
  }

  async updateEconomyConfig(guildId: string, data: any) {
    const config = await this.prisma.economyConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });
    await this.redis.del(`economy:config:${guildId}`);
    return config;
  }

  async getLevelConfig(guildId: string) {
    const config = await this.prisma.levelConfig.findUnique({
      where: { guildId },
      include: { guild: { include: { levelRewards: true } } },
    });
    return config;
  }

  async updateLevelConfig(guildId: string, data: any) {
    const config = await this.prisma.levelConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });
    await this.redis.del(`level:config:${guildId}`);
    return config;
  }

  async getTicketConfig(guildId: string) {
    return this.prisma.ticketConfig.findUnique({ where: { guildId } });
  }

  async updateTicketConfig(guildId: string, data: any) {
    const config = await this.prisma.ticketConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });
    await this.redis.del(`ticket:config:${guildId}`);
    return config;
  }

  async getAutoModRules(guildId: string) {
    return this.prisma.autoModRule.findMany({
      where: { guild: { id: guildId } },
      orderBy: { type: 'asc' },
    });
  }

  async updateAutoModRule(ruleId: string, data: any) {
    const rule = await this.prisma.autoModRule.update({
      where: { id: ruleId },
      data,
    });
    await this.redis.delPattern(`automod:*`);
    return rule;
  }

  async createAutoModRule(guildId: string, data: any) {
    const rule = await this.prisma.autoModRule.create({
      data: { guildId, ...data },
    });
    await this.redis.delPattern(`automod:*`);
    return rule;
  }

  async deleteAutoModRule(ruleId: string) {
    await this.prisma.autoModRule.delete({ where: { id: ruleId } });
    await this.redis.delPattern(`automod:*`);
  }

  async getModerationConfig(guildId: string) {
    const cached = await this.redis.getJson(`moderation:config:${guildId}`);
    if (cached) return cached;

    const config = await this.prisma.moderationConfig.findUnique({
      where: { guildId },
    });

    if (config) {
      await this.redis.setJson(`moderation:config:${guildId}`, config, 300);
    }
    return config;
  }

  async updateModerationConfig(guildId: string, data: any) {
    const config = await this.prisma.moderationConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data },
    });
    await this.redis.del(`moderation:config:${guildId}`);
    return config;
  }

  // Reaction Roles
  async getReactionPanels(guildId: string) {
    return this.prisma.reactionPanel.findMany({
      where: { guildId },
      include: { buttons: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReactionPanel(panelId: string) {
    return this.prisma.reactionPanel.findUnique({
      where: { id: panelId },
      include: { buttons: true },
    });
  }

  async createReactionPanel(guildId: string, data: any) {
    const { buttons, id, createdAt, ...panelData } = data;
    return this.prisma.reactionPanel.create({
      data: {
        guildId,
        ...panelData,
        buttons: {
          create: (buttons || []).map((b: any) => ({
            label: b.label,
            roleId: b.roleId,
            style: b.style,
            emoji: b.emoji,
          })),
        },
      },
      include: { buttons: true },
    });
  }

  async updateReactionPanel(panelId: string, data: any) {
    const { buttons, id, guildId, createdAt, ...panelData } = data;

    if (buttons) {
      await this.prisma.reactionButton.deleteMany({
        where: { panelId },
      });
    }

    return this.prisma.reactionPanel.update({
      where: { id: panelId },
      data: {
        ...panelData,
        buttons: buttons ? {
          create: buttons.map((b: any) => ({
            label: b.label,
            roleId: b.roleId,
            style: b.style,
            emoji: b.emoji,
          })),
        } : undefined,
      },
      include: { buttons: true },
    });
  }

  async deleteReactionPanel(panelId: string) {
    return this.prisma.reactionPanel.delete({
      where: { id: panelId },
    });
  }
}
