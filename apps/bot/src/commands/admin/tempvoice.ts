// ============================================
// Command: /tempvoice
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class TempVoiceCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('tempvoice')
        .setDescription('Skonfiguruj kanały tymczasowe')
        .addSubcommand((sub) =>
          sub.setName('setup')
             .setDescription('Ustaw kanał główny (Join to Create)')
             .addChannelOption((opt) => opt.setName('category').setDescription('Kategoria dla nowych kanałów').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      cooldown: 5,
      module: 'admin',
      premium: true, // Wymaga premium
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const category = interaction.options.getChannel('category', true);

    const channel = await interaction.guild?.channels.create({
      name: '➕ Dołącz by utworzyć',
      type: ChannelType.GuildVoice,
      parent: category.id,
    });

    if (channel) {
      await interaction.reply({ embeds: [Embed.success('Skonfigurowano', `Kanał do tworzenia tymczasowych VC: <#${channel.id}>`)], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'Nie udało się utworzyć kanału.')], ephemeral: true });
    }
  }
}
