// ============================================
// Command: /rank
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import { formatNumber, calculateXpForLevel } from '@discord-saas/shared';
import type { BotClient } from '../../client';

export default class RankCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Sprawdź swój poziom')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(false)),
      cooldown: 5,
      module: 'levels',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const guild = await client.prisma.guild.findUnique({ where: { discordId: interaction.guildId! } });
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
      create: { guildId: guild.id, userId: user.id },
    });

    // Oblicz pozycję w rankingu
    const rank = await client.prisma.guildMember.count({
      where: { guildId: guild.id, xp: { gt: member.xp } },
    }) + 1;

    const xpNeeded = calculateXpForLevel(member.level);
    let currentXpInLevel = member.xp;
    for (let i = 0; i < member.level; i++) {
      currentXpInLevel -= calculateXpForLevel(i);
    }

    const progress = Math.floor((currentXpInLevel / xpNeeded) * 20);
    const bar = '█'.repeat(progress) + '░'.repeat(20 - progress);

    const embed = new Embed()
      .setTitle(`📊 Rank — ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '🏆 Pozycja', value: `#${rank}`, inline: true },
        { name: '⭐ Poziom', value: `${member.level}`, inline: true },
        { name: '✨ XP', value: `${formatNumber(member.xp)}`, inline: true },
        { name: '📈 Postęp', value: `\`${bar}\` ${currentXpInLevel}/${xpNeeded}`, inline: false },
        { name: '💬 Wiadomości', value: `${formatNumber(member.messages)}`, inline: true },
      );

    await interaction.reply({ embeds: [embed] });
  }
}
