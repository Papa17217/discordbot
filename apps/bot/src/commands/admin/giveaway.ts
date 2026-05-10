// ============================================
// Command: /giveaway
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class GiveawayCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Zarządzaj konkursami')
        .addSubcommand((sub) =>
          sub.setName('start')
             .setDescription('Rozpocznij nowy giveaway')
             .addStringOption((opt) => opt.setName('prize').setDescription('Nagroda').setRequired(true))
             .addStringOption((opt) => opt.setName('duration').setDescription('Czas trwania (np. 1h, 1d)').setRequired(true))
             .addIntegerOption((opt) => opt.setName('winners').setDescription('Liczba zwycięzców').setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEvents),
      cooldown: 5,
      module: 'admin',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const prize = interaction.options.getString('prize', true);
    const durationStr = interaction.options.getString('duration', true);
    const winners = interaction.options.getInteger('winners', true);

    // Tu logika obliczania czasu w oparciu o durationStr, aktualnie tylko mock
    const endTime = Math.floor(Date.now() / 1000) + 3600; // default 1 godzina

    const embed = new Embed()
      .setTitle('🎉 GIVEAWAY 🎉')
      .setDescription(`**Nagroda:** ${prize}\n**Zwycięzcy:** ${winners}\n**Kończy się:** <t:${endTime}:R>`)
      .setFooter({ text: 'Zareaguj 🎉 aby dołączyć!' });

    const msg = await (interaction.channel as any)?.send({ embeds: [embed] });
    await msg?.react('🎉');

    await interaction.reply({ content: 'Giveaway rozpoczął się pomyślnie!', ephemeral: true });
  }
}
