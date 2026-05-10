import { Event } from '../structures/Event';
import { Message, TextChannel } from 'discord.js';
import { calculateXpForLevel } from '@discord-saas/shared';
import { Embed } from '../structures/Embed';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';
import { handleAutoMod } from '../handlers/autoModHandler';

export default class MessageCreateEvent extends Event<'messageCreate'> {
  constructor() {
    super({ name: 'messageCreate' });
  }

  async execute(client: BotClient, message: Message) {
    if (message.author.bot || !message.guild) return;
    
    logger.info(`📩 NOWA WIADOMOŚĆ: [${message.guild.name}] ${message.author.tag}: "${message.content}"`);

    try {
      // ── 1. AutoMod Check (Priorytet - najpierw sprawdzamy bezpieczeństwo) ──
      // handleAutoMod sam sprawdza czy jest włączony i wykonuje akcje
      await handleAutoMod(client, message);
      


      const guild = await client.prisma.guild.findUnique({
        where: { discordId: message.guild.id },
        include: { config: true, levelConfig: true },
      });

      if (!guild) return;

      // ── 2. XP System ─────────────────────────
      if (guild.config?.levelsEnabled && guild.levelConfig) {
        await this.handleXp(client, message, guild.id, guild.levelConfig);
      }
    } catch (error) {
      logger.error('Błąd w messageCreate:', error);
    }
  }

  private async handleXp(client: BotClient, message: Message, guildId: string, levelConfig: any) {
    if (levelConfig.noXpChannelIds.includes(message.channel.id)) return;
    const member = message.member;
    if (!member) return;
    if (levelConfig.noXpRoleIds.some((id: string) => member.roles.cache.has(id))) return;

    const cooldownKey = `xp:cooldown:${guildId}:${message.author.id}`;
    const onCooldown = await client.redis.get(cooldownKey);
    if (onCooldown) return;

    await client.redis.set(cooldownKey, '1');
    await client.redis.expire(cooldownKey, levelConfig.xpCooldown);

    let user = await client.prisma.user.findUnique({
      where: { discordId: message.author.id },
    });
    if (!user) {
      user = await client.prisma.user.create({
        data: {
          discordId: message.author.id,
          username: message.author.username,
          avatar: message.author.avatar,
        },
      });
    }

    const xpGain = levelConfig.xpPerMessage + Math.floor(Math.random() * 5);

    const guildMember = await client.prisma.guildMember.upsert({
      where: { guildId_userId: { guildId, userId: user.id } },
      update: {
        xp: { increment: xpGain },
        messages: { increment: 1 },
        lastXpGain: new Date(),
      },
      create: {
        guildId,
        userId: user.id,
        xp: xpGain,
        messages: 1,
        lastXpGain: new Date(),
      },
    });

    const xpForNextLevel = calculateXpForLevel(guildMember.level);
    const currentLevelXp = guildMember.xp - this.totalXpForLevel(guildMember.level);

    if (currentLevelXp >= xpForNextLevel) {
      const newLevel = guildMember.level + 1;

      await client.prisma.guildMember.update({
        where: { id: guildMember.id },
        data: { level: newLevel },
      });

      const levelUpMsg = levelConfig.levelUpMessage
        .replace(/{user}/g, `<@${message.author.id}>`)
        .replace(/{level}/g, newLevel.toString());

      const channelId = levelConfig.levelUpChannelId || message.channel.id;
      const channel = message.guild!.channels.cache.get(channelId) as TextChannel;
      if (channel) {
        await channel.send({
          embeds: [Embed.success('Level Up!', levelUpMsg)],
        });
      }

      const rewards = await client.prisma.levelReward.findMany({
        where: { guildId, level: { lte: newLevel } },
      });

      for (const reward of rewards) {
        try {
          if (reward.level === newLevel || !reward.removeOnHigher) {
            await member.roles.add(reward.roleId);
          }
        } catch {}
      }
    }
  }

  private totalXpForLevel(level: number): number {
    let total = 0;
    for (let i = 0; i < level; i++) {
      total += calculateXpForLevel(i);
    }
    return total;
  }
}
