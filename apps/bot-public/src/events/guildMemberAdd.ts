// ============================================
// Event: GuildMemberAdd — Nowy członek
// ============================================

import { Event } from '../structures/Event';
import { GuildMember, TextChannel } from 'discord.js';
import { Embed } from '../structures/Embed';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class GuildMemberAddEvent extends Event<'guildMemberAdd'> {
  constructor() {
    super({ name: 'guildMemberAdd' });
  }

  async execute(client: BotClient, member: GuildMember) {
    try {
      const guild = await client.prisma.guild.findUnique({
        where: { discordId: member.guild.id },
        include: { config: true, welcomeConfig: true },
      });

      if (!guild) return;

      // Aktualizuj member count
      await client.prisma.guild.update({
        where: { id: guild.id },
        data: { memberCount: member.guild.memberCount },
      });

      // Utwórz/zaktualizuj członka w bazie
      let user = await client.prisma.user.findUnique({
        where: { discordId: member.user.id },
      });
      if (!user) {
        user = await client.prisma.user.create({
          data: {
            discordId: member.user.id,
            username: member.user.username,
            avatar: member.user.avatar,
          },
        });
      }

      await client.prisma.guildMember.upsert({
        where: { guildId_userId: { guildId: guild.id, userId: user.id } },
        update: {},
        create: { guildId: guild.id, userId: user.id },
      });

      // Analytics
      await client.prisma.analyticsEvent.create({
        data: { guildId: guild.id, type: 'MEMBER_JOIN', data: { userId: member.user.id } },
      });

      // Welcome message
      if (!guild.config?.welcomeEnabled || !guild.welcomeConfig) return;

      const welcomeConfig = guild.welcomeConfig;
      if (!welcomeConfig.channelId) return;

      const channel = member.guild.channels.cache.get(welcomeConfig.channelId) as TextChannel;
      if (!channel) return;

      const message = welcomeConfig.message
        .replace(/{user}/g, `<@${member.user.id}>`)
        .replace(/{username}/g, member.user.username)
        .replace(/{server}/g, member.guild.name)
        .replace(/{memberCount}/g, member.guild.memberCount.toString());

      if (welcomeConfig.embedEnabled) {
        const embed = new Embed()
          .setTitle(welcomeConfig.embedTitle)
          .setDescription(welcomeConfig.embedDescription || message)
          .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
          .setColor(welcomeConfig.embedColor as any);

        if (welcomeConfig.embedImage) {
          embed.setImage(welcomeConfig.embedImage);
        }

        await channel.send({ embeds: [embed] });
      } else {
        await channel.send(message);
      }

      // Auto roles
      if (welcomeConfig.autoRoleIds.length > 0) {
        for (const roleId of welcomeConfig.autoRoleIds) {
          try {
            await member.roles.add(roleId);
          } catch {
            logger.warn(`Nie udało się nadać roli ${roleId} dla ${member.user.tag}`);
          }
        }
      }

      // DM
      if (welcomeConfig.dmEnabled && welcomeConfig.dmMessage) {
        try {
          const dmMsg = welcomeConfig.dmMessage
            .replace(/{user}/g, member.user.username)
            .replace(/{server}/g, member.guild.name);
          await member.send(dmMsg);
        } catch {
          // Użytkownik ma wyłączone DM
        }
      }
    } catch (error) {
      logger.error('Błąd w guildMemberAdd:', error);
    }
  }
}
