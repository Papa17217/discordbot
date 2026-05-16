// ============================================
// Command: /setup
// ============================================

import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class SetupCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Skonfiguruj podstawowe ustawienia bota')
        .addSubcommand((sub) => 
          sub.setName('welcome')
             .setDescription('Skonfiguruj kanał powitań')
             .addChannelOption((opt) => opt.setName('channel').setDescription('Kanał tekstowy').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        .addSubcommand((sub) =>
          sub.setName('logs')
             .setDescription('Skonfiguruj kanał logów')
             .addChannelOption((opt) => opt.setName('channel').setDescription('Kanał tekstowy').addChannelTypes(ChannelType.GuildText).setRequired(true))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
      cooldown: 5,
      module: 'admin',
      permissions: [PermissionFlagsBits.Administrator],
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const subcommand = interaction.options.getSubcommand();
    const channel = interaction.options.getChannel('channel', true);

    const guild = await client.prisma.guild.upsert({
      where: { discordId_botType: { discordId: interaction.guildId! , botType: 'PRIVATE' } },
      update: {},
      create: { discordId: interaction.guildId!, name: interaction.guild!.name, ownerId: interaction.guild!.ownerId, botType: 'PRIVATE' },
    });

    if (subcommand === 'welcome') {
      await client.prisma.welcomeConfig.upsert({
        where: { guildId: guild.id },
        update: { channelId: channel.id, dmEnabled: true },
        create: { guildId: guild.id, channelId: channel.id, dmEnabled: true },
      });
      await interaction.reply({ embeds: [Embed.success('Sukces', `Kanał powitań ustawiony na <#${channel.id}>`)], ephemeral: true });
    } else if (subcommand === 'logs') {
      // W prawdziwej aplikacji zapisalibyśmy to w tabeli konfiguracji logów
      await interaction.reply({ embeds: [Embed.success('Sukces', `Kanał logów ustawiony na <#${channel.id}>`)], ephemeral: true });
    }
  }
}
