// ============================================
// Command: /leaderboard
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatNumber } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class LeaderboardCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Wyświetl ranking')
        .addStringOption((opt) =>
          opt.setName('type').setDescription('Typ rankingu').setRequired(false)
            .addChoices(
              { name: '💰 Ekonomia', value: 'economy' },
              { name: '📊 Poziomy', value: 'levels' },
              { name: '💬 Wiadomości', value: 'messages' },
            ),
        ),
      cooldown: 10,
      module: 'economy',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const type = interaction.options.getString('type') || 'economy';
    const guild = await client.prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
    if (!guild) return;

    let orderBy: any;
    let title: string;
    let emoji: string;

    switch (type) {
      case 'levels':
        orderBy = { level: 'desc' as const };
        title = '📊 Ranking poziomów';
        emoji = '⭐';
        break;
      case 'messages':
        orderBy = { messages: 'desc' as const };
        title = '💬 Ranking wiadomości';
        emoji = '💬';
        break;
      default:
        orderBy = { balance: 'desc' as const };
        title = '💰 Ranking ekonomii';
        emoji = '💰';
    }

    const members = await client.prisma.guildMember.findMany({
      where: { guildId: guild.id },
      orderBy,
      take: 10,
      include: { user: { select: { username: true, discordId: true } } },
    });

    const medals = ['🥇', '🥈', '🥉'];
    const lines = members.map((m, i) => {
      const medal = medals[i] || `**${i + 1}.**`;
      const value = type === 'levels' ? `Lvl ${m.level} (${formatNumber(m.xp)} XP)`
        : type === 'messages' ? `${formatNumber(m.messages)} wiadomości`
        : `${formatNumber(m.balance)} ${emoji}`;
      return `${medal} <@${m.user.discordId}> — ${value}`;
    });

    const embed = new Embed()
      .setTitle(title)
      .setDescription(lines.join('\n') || 'Brak danych');

    await interaction.reply({ embeds: [embed] });
  }
}
