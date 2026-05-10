// ============================================
// Command: /purge
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class PurgeCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('purge')
        .setDescription('Usuń wiadomości')
        .addIntegerOption((opt) => opt.setName('amount').setDescription('Ilość (1-100)').setMinValue(1).setMaxValue(100).setRequired(true))
        .addUserOption((opt) => opt.setName('user').setDescription('Tylko od tego użytkownika').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
      cooldown: 5,
      module: 'moderation',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    let messages = await channel.messages.fetch({ limit: Math.min(amount + 1, 100) });

    if (targetUser) {
      messages = messages.filter((m) => m.author.id === targetUser.id);
    }

    // Odfiltruj za stare (> 14 dni)
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    messages = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

    const deleted = await channel.bulkDelete(messages.first(amount), true);

    await interaction.editReply({
      embeds: [Embed.success('Wyczyszczono', `Usunięto **${deleted.size}** wiadomości.`)],
    });
  }
}
