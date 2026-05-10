// ============================================
// Event: GuildMemberRemove
// ============================================

import { Event } from '../structures/Event';
import { GuildMember, TextChannel, PartialGuildMember } from 'discord.js';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class GuildMemberRemoveEvent extends Event<'guildMemberRemove'> {
  constructor() {
    super({ name: 'guildMemberRemove' });
  }

  async execute(client: BotClient, member: GuildMember | PartialGuildMember) {
    try {
      const guild = await client.prisma.guild.findUnique({
        where: { discordId: member.guild.id },
        include: { config: true, welcomeConfig: true },
      });

      if (!guild) return;

      await client.prisma.guild.update({
        where: { id: guild.id },
        data: { memberCount: member.guild.memberCount },
      });

      // Analytics
      await client.prisma.analyticsEvent.create({
        data: { guildId: guild.id, type: 'MEMBER_LEAVE', data: { userId: member.user.id } },
      });

      // Leave message
      if (!guild.config?.welcomeEnabled || !guild.welcomeConfig) return;

      const welcomeConfig = guild.welcomeConfig;
      if (!welcomeConfig.leaveChannelId) return;

      const channel = member.guild.channels.cache.get(welcomeConfig.leaveChannelId) as TextChannel;
      if (!channel) return;

      const message = welcomeConfig.leaveMessage
        .replace(/{user}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{memberCount}/g, member.guild.memberCount.toString());

      await channel.send(message);
    } catch (error) {
      logger.error('Błąd w guildMemberRemove:', error);
    }
  }
}
