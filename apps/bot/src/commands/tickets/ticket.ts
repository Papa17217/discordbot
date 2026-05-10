// ============================================
// Command: /ticket
// ============================================

import {
  SlashCommandBuilder, ChatInputCommandInteraction, ChannelType,
  PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle,
} from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class TicketCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('System ticketów')
        .addSubcommand((sub) => sub.setName('create').setDescription('Utwórz nowy ticket').addStringOption((opt) => opt.setName('subject').setDescription('Temat').setRequired(false)))
        .addSubcommand((sub) => sub.setName('close').setDescription('Zamknij ten ticket'))
        .addSubcommand((sub) => sub.setName('setup').setDescription('Ustaw panel ticketów').addChannelOption((opt) => opt.setName('channel').setDescription('Kanał').setRequired(true))),
      cooldown: 10,
      module: 'tickets',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case 'create': return this.createTicket(interaction, client);
      case 'close': return this.closeTicket(interaction, client);
      case 'setup': return this.setupPanel(interaction, client);
    }
  }

  private async createTicket(interaction: ChatInputCommandInteraction, client: BotClient) {
    const subject = interaction.options.getString('subject') || 'Pomoc';
    const guild = await client.prisma.guild.findUnique({
      where: { discordId: interaction.guildId! },
      include: { ticketConfig: true },
    });
    if (!guild || !guild.ticketConfig) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'System ticketów nie jest skonfigurowany.')], ephemeral: true });
      return;
    }

    let user = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!user) {
      user = await client.prisma.user.create({
        data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar },
      });
    }

    // Sprawdź limit ticketów
    const openTickets = await client.prisma.ticket.count({
      where: { guildId: guild.id, userId: user.id, status: { not: 'CLOSED' } },
    });
    if (openTickets >= guild.ticketConfig.maxTicketsPerUser) {
      await interaction.reply({ embeds: [Embed.warning('Limit', 'Masz za dużo otwartych ticketów.')], ephemeral: true });
      return;
    }

    // Utwórz kanał
    const channel = await interaction.guild!.channels.create({
      name: `ticket-${interaction.user.username}`,
      type: ChannelType.GuildText,
      parent: guild.ticketConfig.categoryId || undefined,
      permissionOverwrites: [
        { id: interaction.guild!.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ...guild.ticketConfig.supportRoleIds.map((roleId) => ({
          id: roleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
        })),
      ],
    });

    await client.prisma.ticket.create({
      data: { guildId: guild.id, channelId: channel.id, userId: user.id, subject },
    });

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Zamknij ticket').setStyle(ButtonStyle.Danger),
    );

    await channel.send({
      embeds: [new Embed().setTitle(`🎫 Ticket — ${subject}`).setDescription(`Utworzony przez <@${interaction.user.id}>\n\nOpisz swój problem, zespół wsparcia wkrótce odpowie.`)],
      components: [row],
    });

    await interaction.reply({ embeds: [Embed.success('Ticket utworzony', `Przejdź do <#${channel.id}>`)], ephemeral: true });
  }

  private async closeTicket(interaction: ChatInputCommandInteraction, client: BotClient) {
    const ticket = await client.prisma.ticket.findUnique({
      where: { channelId: interaction.channelId },
    });
    if (!ticket) {
      await interaction.reply({ embeds: [Embed.error('Błąd', 'To nie jest kanał ticketu.')], ephemeral: true });
      return;
    }

    await client.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'CLOSED', closedAt: new Date() },
    });

    await interaction.reply({ embeds: [Embed.info('Ticket zamknięty', 'Kanał zostanie usunięty za 5 sekund.')] });
    setTimeout(async () => {
      try { await interaction.channel?.delete(); } catch {}
    }, 5000);
  }

  private async setupPanel(interaction: ChatInputCommandInteraction, client: BotClient) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ embeds: [Embed.error('Brak uprawnień')], ephemeral: true });
      return;
    }

    const channel = interaction.options.getChannel('channel', true);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('ticket_create').setLabel('📩 Utwórz ticket').setStyle(ButtonStyle.Primary),
    );

    const textChannel = interaction.guild!.channels.cache.get(channel.id) as any;
    await textChannel.send({
      embeds: [new Embed().setTitle('🎫 System Ticketów').setDescription('Kliknij przycisk poniżej, aby utworzyć ticket.\nNasz zespół odpowie jak najszybciej.')],
      components: [row],
    });

    await interaction.reply({ embeds: [Embed.success('Panel ustawiony', `Panel ticketów wysłany na <#${channel.id}>`)], ephemeral: true });
  }
}
