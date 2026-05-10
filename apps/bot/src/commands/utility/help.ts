// ============================================
// Command: /help
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class HelpCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Wyświetl listę komend')
        .addStringOption((opt) => opt.setName('command').setDescription('Nazwa komendy').setRequired(false)),
      cooldown: 5,
      module: 'utility',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const commandName = interaction.options.getString('command');

    if (commandName) {
      const command = client.commands.get(commandName);
      if (!command) {
        await interaction.reply({ embeds: [Embed.error('Nie znaleziono', `Komenda \`/${commandName}\` nie istnieje.`)], ephemeral: true });
        return;
      }

      const embed = new Embed()
        .setTitle(`📖 /${command.data.name}`)
        .setDescription(command.data.description)
        .addFields(
          { name: '⏱️ Cooldown', value: `${command.cooldown}s`, inline: true },
          { name: '📁 Moduł', value: command.module, inline: true },
          { name: '⭐ Premium', value: command.premium ? 'Tak' : 'Nie', inline: true },
        );

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Grupuj komendy po modułach
    const categories = new Map<string, string[]>();
    client.commands.forEach((cmd) => {
      const cat = cmd.module || 'general';
      if (!categories.has(cat)) categories.set(cat, []);
      categories.get(cat)!.push(`\`/${cmd.data.name}\` — ${cmd.data.description}`);
    });

    const embed = new Embed()
      .setTitle('📚 Lista komend')
      .setDescription('Użyj `/help <komenda>` aby zobaczyć szczegóły.');

    const categoryEmojis: Record<string, string> = {
      utility: '🔧', moderation: '🛡️', economy: '💰',
      levels: '📊', tickets: '🎫', admin: '⚙️', fun: '🎉',
    };

    categories.forEach((cmds, category) => {
      const emoji = categoryEmojis[category] || '📁';
      embed.addFields({
        name: `${emoji} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        value: cmds.join('\n'),
        inline: false,
      });
    });

    await interaction.reply({ embeds: [embed] });
  }
}
