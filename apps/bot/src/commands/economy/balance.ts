// ============================================
// Command: /balance
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatNumber } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class BalanceCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('balance')
        .setDescription('Sprawdź swoje saldo')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(false)),
      cooldown: 3,
      module: 'economy',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = await client.prisma.guild.findUnique({
      where: { discordId: interaction.guildId! },
      include: { economyConfig: true },
    });
    if (!guild) return;

    let user = await client.prisma.user.findUnique({ where: { discordId: targetUser.id } });
    if (!user) {
      user = await client.prisma.user.create({
        data: { discordId: targetUser.id, username: targetUser.username, avatar: targetUser.avatar },
      });
    }

    const member = await client.prisma.guildMember.upsert({
      where: { guildId_userId: { guildId: guild.id, userId: user.id } },
      update: {},
      create: { guildId: guild.id, userId: user.id, balance: guild.economyConfig?.startingBalance || 0 },
    });

    const emoji = guild.economyConfig?.currencyEmoji || '💰';
    const name = guild.economyConfig?.currencyName || 'coins';

    const embed = new Embed()
      .setTitle(`${emoji} Portfel — ${targetUser.username}`)
      .addFields(
        { name: 'Saldo', value: `**${formatNumber(member.balance)}** ${name}`, inline: true },
        { name: 'Poziom', value: `**${member.level}**`, inline: true },
      )
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }));

    await interaction.reply({ embeds: [embed] });
  }
}
