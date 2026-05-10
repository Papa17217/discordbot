// ============================================
// Command: /userinfo
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, GuildMember } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatDate } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class UserInfoCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Informacje o użytkowniku')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(false)),
      cooldown: 5,
      module: 'utility',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const user = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild?.members.cache.get(user.id) as GuildMember | undefined;

    const roles = member?.roles.cache
      .filter((r) => r.id !== interaction.guild?.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => `${r}`)
      .slice(0, 10)
      .join(', ') || 'Brak';

    const embed = new Embed()
      .setTitle(user.tag)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: '🆔 ID', value: `\`${user.id}\``, inline: true },
        { name: '📅 Konto utworzone', value: formatDate(user.createdAt), inline: true },
        { name: '📥 Dołączył', value: member ? formatDate(member.joinedAt!) : 'N/A', inline: true },
        { name: `🎭 Role (${member?.roles.cache.size ? member.roles.cache.size - 1 : 0})`, value: roles, inline: false },
      );

    await interaction.reply({ embeds: [embed] });
  }
}
