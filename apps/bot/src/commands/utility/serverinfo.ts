// ============================================
// Command: /serverinfo
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatDate } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class ServerInfoCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Informacje o serwerze'),
      cooldown: 5,
      module: 'utility',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const guild = interaction.guild!;

    const embed = new Embed()
      .setTitle(guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }) || null)
      .addFields(
        { name: '👑 Właściciel', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Członkowie', value: `\`${guild.memberCount}\``, inline: true },
        { name: '💬 Kanały', value: `\`${guild.channels.cache.size}\``, inline: true },
        { name: '😀 Emoji', value: `\`${guild.emojis.cache.size}\``, inline: true },
        { name: '🎭 Role', value: `\`${guild.roles.cache.size}\``, inline: true },
        { name: '🔗 Boost', value: `\`Poziom ${guild.premiumTier}\` (${guild.premiumSubscriptionCount} boostów)`, inline: true },
        { name: '📅 Utworzony', value: formatDate(guild.createdAt), inline: false },
      )
      .setFooter({ text: `ID: ${guild.id}` });

    await interaction.reply({ embeds: [embed] });
  }
}
