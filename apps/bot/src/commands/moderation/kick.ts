// ============================================
// Command: /kick
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class KickCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Wyrzuć użytkownika z serwera')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Powód').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
      cooldown: 5,
      module: 'moderation',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Brak powodu';
    const member = interaction.guild?.members.cache.get(target.id);

    if (!member) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Użytkownik nie jest na serwerze.')], ephemeral: true });
      return;
    }
    if (!member.kickable) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Nie mogę wyrzucić tego użytkownika.')], ephemeral: true });
      return;
    }

    await member.kick(`${interaction.user.tag}: ${reason}`);

    const guild = await client.prisma.guild.findUnique({ where: { discordId_botType: { discordId: interaction.guildId! , botType: 'PRIVATE' } } });
    if (guild) {
      let mod = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
      if (!mod) mod = await client.prisma.user.create({ data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar } });
      let tgt = await client.prisma.user.findUnique({ where: { discordId: target.id } });
      if (!tgt) tgt = await client.prisma.user.create({ data: { discordId: target.id, username: target.username, avatar: target.avatar } });
      await client.prisma.moderationLog.create({ data: { guildId: guild.id, moderatorId: mod.id, targetId: tgt.id, action: 'KICK', reason } });
    }

    await interaction.reply({ embeds: [Embed.success('Wyrzucony', `**${target.tag}** został wyrzucony.\n**Powód:** ${reason}`)] });
  }
}
