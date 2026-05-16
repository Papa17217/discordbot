// ============================================
// Command: /warn
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class WarnCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('warn')
        .setDescription('Ostrzeż użytkownika')
        .addUserOption((opt) => opt.setName('user').setDescription('Użytkownik').setRequired(true))
        .addStringOption((opt) => opt.setName('reason').setDescription('Powód').setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
      cooldown: 3,
      module: 'moderation',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    const guild = await client.prisma.guild.findUnique({ where: { discordId_botType: { discordId: interaction.guildId! , botType: 'PRIVATE' } } });
    if (!guild) return;

    let mod = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!mod) mod = await client.prisma.user.create({ data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar } });
    let tgt = await client.prisma.user.findUnique({ where: { discordId: target.id } });
    if (!tgt) tgt = await client.prisma.user.create({ data: { discordId: target.id, username: target.username, avatar: target.avatar } });

    await client.prisma.warning.create({ data: { guildId: guild.id, userId: tgt.id, moderatorId: mod.id, reason } });
    const member = await client.prisma.guildMember.upsert({
      where: { guildId_userId: { guildId: guild.id, userId: tgt.id } },
      update: { warnings: { increment: 1 } },
      create: { guildId: guild.id, userId: tgt.id, warnings: 1 },
    });
    await client.prisma.moderationLog.create({ data: { guildId: guild.id, moderatorId: mod.id, targetId: tgt.id, action: 'WARN', reason } });

    const totalWarns = member.warnings;
    const embed = Embed.success('Ostrzeżenie', `**${target.tag}** otrzymał ostrzeżenie.\n**Powód:** ${reason}\n**Łączna liczba:** ${totalWarns}`);

    if (totalWarns >= 5) {
      embed.addFields({ name: '⚠️ Uwaga', value: 'Użytkownik ma 5+ ostrzeżeń!' });
    }

    await interaction.reply({ embeds: [embed] });
  }
}
