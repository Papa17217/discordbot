// ============================================
// Command: /ping
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatUptime } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class PingCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdź opóźnienie bota'),
      cooldown: 5,
      module: 'utility',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const sent = await interaction.deferReply({ fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
    const wsLatency = client.ws.ping;

    const embed = new Embed()
      .setTitle('🏓 Pong!')
      .addFields(
        { name: '📡 API', value: `\`${roundtrip}ms\``, inline: true },
        { name: '💓 WebSocket', value: `\`${wsLatency}ms\``, inline: true },
        { name: '⏱️ Uptime', value: `\`${formatUptime(client.uptime || 0)}\``, inline: true },
      );

    await interaction.editReply({ embeds: [embed] });
  }
}
