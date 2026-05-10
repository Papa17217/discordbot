// ============================================
// Command: /daily
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatNumber } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class DailyCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Odbierz dzienną nagrodę'),
      cooldown: 5,
      module: 'economy',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const guild = await client.prisma.guild.findUnique({
      where: { discordId: interaction.guildId! },
      include: { economyConfig: true },
    });
    if (!guild) return;

    let user = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!user) {
      user = await client.prisma.user.create({
        data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar },
      });
    }

    const member = await client.prisma.guildMember.upsert({
      where: { guildId_userId: { guildId: guild.id, userId: user.id } },
      update: {},
      create: { guildId: guild.id, userId: user.id },
    });

    const cooldownMs = guild.economyConfig?.dailyCooldown || 86400000;
    if (member.lastDaily && Date.now() - member.lastDaily.getTime() < cooldownMs) {
      const remaining = cooldownMs - (Date.now() - member.lastDaily.getTime());
      const hours = Math.floor(remaining / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      await interaction.reply({
        embeds: [Embed.warning('Cooldown', `Następna nagroda za **${hours}h ${minutes}m**`)],
        ephemeral: true,
      });
      return;
    }

    const amount = guild.economyConfig?.dailyAmount || 100;
    const emoji = guild.economyConfig?.currencyEmoji || '💰';
    const name = guild.economyConfig?.currencyName || 'coins';

    await client.prisma.guildMember.update({
      where: { id: member.id },
      data: { balance: { increment: amount }, lastDaily: new Date() },
    });

    await client.prisma.transaction.create({
      data: { userId: user.id, guildId: guild.id, amount, type: 'DAILY', description: 'Dzienna nagroda' },
    });

    await interaction.reply({
      embeds: [Embed.success('Dzienna nagroda!', `Otrzymałeś **${formatNumber(amount)}** ${emoji} ${name}!\nNowe saldo: **${formatNumber(member.balance + amount)}** ${name}`)],
    });
  }
}
