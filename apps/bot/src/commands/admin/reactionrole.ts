// ============================================
// Command: /reactionrole
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class ReactionRoleCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Skonfiguruj role nadawane przez reakcje')
        .addSubcommand((sub) =>
          sub.setName('create')
             .setDescription('Utwórz panel ról')
             .addRoleOption((opt) => opt.setName('role1').setDescription('Pierwsza rola').setRequired(true))
             .addStringOption((opt) => opt.setName('label1').setDescription('Etykieta dla pierwszej roli').setRequired(true))
             .addRoleOption((opt) => opt.setName('role2').setDescription('Druga rola').setRequired(false))
             .addStringOption((opt) => opt.setName('label2').setDescription('Etykieta dla drugiej roli').setRequired(false))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),
      cooldown: 5,
      module: 'admin',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const role1 = interaction.options.getRole('role1', true);
    const label1 = interaction.options.getString('label1', true);
    const role2 = interaction.options.getRole('role2');
    const label2 = interaction.options.getString('label2');

    const row = new ActionRowBuilder<ButtonBuilder>();

    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rr_${role1.id}`)
        .setLabel(label1)
        .setStyle(ButtonStyle.Primary)
    );

    if (role2 && label2) {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`rr_${role2.id}`)
          .setLabel(label2)
          .setStyle(ButtonStyle.Success)
      );
    }

    const embed = new Embed()
      .setTitle('Wybierz swoje role')
      .setDescription('Kliknij w przyciski poniżej, aby otrzymać lub zdjąć przypisane role.');

    await (interaction.channel as any)?.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Panel ról został pomyślnie utworzony.', ephemeral: true });
  }
}
