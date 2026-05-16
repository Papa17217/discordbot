// ============================================
// Command: /ban
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class BanCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Zbanuj użytkownika')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik do zbanowania').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Powód').setRequired(false))
        .addIntegerOption((opt) => opt.setName('days').setDescription('Dni usuwania wiadomości (0-7)').setMinValue(0).setMaxValue(7).setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
      cooldown: 5,
      module: 'moderation',
      permissions: [PermissionFlagsBits.BanMembers],
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'Brak powodu';
    const days = interaction.options.getInteger('days') || 0;

    if (target.id === interaction.user.id) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Nie możesz zbanować siebie!')], ephemeral: true });
      return;
    }

    const member = interaction.guild?.members.cache.get(target.id);
    if (member && !member.bannable) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Nie mogę zbanować tego użytkownika.')], ephemeral: true });
      return;
    }

    try {
      await interaction.guild?.members.ban(target.id, {
        reason: `${interaction.user.tag}: ${reason}`,
        deleteMessageSeconds: days * 86400,
      });

      // Zapisz w bazie
      const guild = await client.prisma.guild.findUnique({ where: { discordId_botType: { discordId: interaction.guildId! , botType: 'PRIVATE' } } });
      if (guild) {
        let moderator = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
        if (!moderator) {
          moderator = await client.prisma.user.create({
            data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar },
          });
        }
        let targetUser = await client.prisma.user.findUnique({ where: { discordId: target.id } });
        if (!targetUser) {
          targetUser = await client.prisma.user.create({
            data: { discordId: target.id, username: target.username, avatar: target.avatar },
          });
        }

        await client.prisma.moderationLog.create({
          data: {
            guildId: guild.id, moderatorId: moderator.id, targetId: targetUser.id,
            action: 'BAN', reason,
          },
        });
      }

      await interaction.reply({
        embeds: [Embed.success('Użytkownik zbanowany', `**${target.tag}** został zbanowany.\n**Powód:** ${reason}`)],
      });
    } catch (error) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Nie udało się zbanować użytkownika.')], ephemeral: true });
    }
  }
}
