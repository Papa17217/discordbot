import { ButtonInteraction, GuildMember } from 'discord.js';
import type { BotClient } from '../client';
import { Embed } from '../structures/Embed';
import { logger } from '../utils/logger';

export async function handleReactionRoleButton(client: BotClient, interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith('rr_')) return;

  const roleId = interaction.customId.replace('rr_', '');
  const member = interaction.member as GuildMember;

  if (!member) return;

  try {
    const role = interaction.guild?.roles.cache.get(roleId);
    if (!role) {
      await interaction.reply({
        embeds: [Embed.error('Błąd', 'Nie znaleziono przypisanej roli na tym serwerze.')],
        ephemeral: true
      });
      return;
    }

    if (member.roles.cache.has(roleId)) {
      await member.roles.remove(roleId);
      await interaction.reply({
        embeds: [Embed.success('Rola Usunięta', `Pomyślnie usunięto rolę **${role.name}**.`)],
        ephemeral: true
      });
    } else {
      await member.roles.add(roleId);
      await interaction.reply({
        embeds: [Embed.success('Rola Nadana', `Pomyślnie nadano rolę **${role.name}**.`)],
        ephemeral: true
      });
    }
  } catch (error) {
    logger.error('Błąd podczas nadawania roli:', error);
    await interaction.reply({
      embeds: [Embed.error('Błąd', 'Bot nie ma uprawnień do zarządzania tą rolą.')],
      ephemeral: true
    });
  }
}
