// ============================================
// Command: /verify
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class VerifyCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('verify-setup')
        .setDescription('Utwórz panel weryfikacji')
        .addRoleOption((opt) => opt.setName('role').setDescription('Rola przyznawana po weryfikacji').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      cooldown: 5,
      module: 'admin',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const role = interaction.options.getRole('role', true);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`verify_${role.id}`)
        .setLabel('✅ Zweryfikuj się')
        .setStyle(ButtonStyle.Success)
    );

    const embed = new Embed()
      .setTitle('Weryfikacja systemu')
      .setDescription('Kliknij w przycisk poniżej, aby udowodnić, że nie jesteś robotem i uzyskać dostęp do serwera.');

    await interaction.channel?.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: 'Panel weryfikacji został pomyślnie utworzony.', ephemeral: true });
  }
}
