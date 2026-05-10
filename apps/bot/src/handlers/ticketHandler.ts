import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import type { BotClient } from '../client';
import { logger } from '../utils/logger';

export async function handleTicketButton(client: BotClient, interaction: ButtonInteraction) {
  const customId = interaction.customId;

  if (customId.startsWith('ticket:close:') || customId === 'ticket_close') {
    return handleCloseAction(client, interaction);
  }
  if (customId.startsWith('ticket:staff:')) {
    return handleStaffAction(client, interaction);
  }

  if (customId === 'ticket_create') {
    return handleLegacyCreateTicket(client, interaction);
  }

  const button = await client.prisma.ticketButton.findUnique({
    where: { customId },
    include: { panel: true },
  });

  if (!button) return;

  try {
    for (const action of button.actions) {
      switch (action) {
        case 'OPEN_TICKET':
          await handleOpenTicket(client, interaction, button);
          break;
        case 'ADD_ROLE':
          await handleAddRole(client, interaction, button);
          break;
        case 'SEND_MESSAGE':
          await handleSendMessage(client, interaction, button);
          break;
      }
    }
  } catch (error: any) {
    logger.error(`Błąd obsługi przycisku ticketu: ${error.message}`);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: 'Wystąpił błąd podczas wykonywania tej akcji.', flags: [MessageFlags.Ephemeral] });
    }
  }
}

async function handleCloseAction(client: BotClient, interaction: ButtonInteraction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  await interaction.reply({ content: '🔒 Ticket zostanie zamknięty za 5 sekund...', flags: [MessageFlags.Ephemeral] });
  
  setTimeout(async () => {
    try {
      await channel.delete();
      await client.prisma.ticket.update({
        where: { channelId: channel.id },
        data: { status: 'CLOSED', closedAt: new Date() },
      });
    } catch (err) {
      logger.error(`Błąd zamykania kanału: ${err}`);
    }
  }, 5000);
}

async function handleStaffAction(client: BotClient, interaction: ButtonInteraction) {
  const channel = interaction.channel;
  if (!channel || !channel.isTextBased()) return;

  const ticket = await client.prisma.ticket.findUnique({
    where: { channelId: channel.id },
  });

  if (!ticket) return;

  const ticketConfig = await client.prisma.ticketConfig.findUnique({
    where: { guildId: ticket.guildId },
  });

  // Użyj ról przypisanych do ticketu (z przycisku) lub ról globalnych
  const rolesToPing = ticket.staffRoleIds.length > 0 ? ticket.staffRoleIds : (ticketConfig?.supportRoleIds || []);

  if (rolesToPing.length === 0) {
    await interaction.reply({ content: 'Nie skonfigurowano ról wsparcia dla tego ticketu.', flags: [MessageFlags.Ephemeral] });
    return;
  }

  const staffMsg = ticket.staffMessage || 'Administracja potrzebna natychmiast!';

  await interaction.reply({ content: '🔔 Powiadomiono administrację!', flags: [MessageFlags.Ephemeral] });
  await (channel as any).send({
    content: `⚠️ ${rolesToPing.map(id => `<@&${id}>`).join(' ')} ${staffMsg}`,
  });
}

async function handleOpenTicket(client: BotClient, interaction: ButtonInteraction, button: any) {
  const guild = interaction.guild;
  if (!guild) return;

  if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
  }

  const ticketConfig = await client.prisma.ticketConfig.findUnique({
    where: { guildId: button.panel.guildId },
  });

  const permissionOverwrites: any[] = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
  ];

  if (ticketConfig?.supportRoleIds) {
    for (const roleId of ticketConfig.supportRoleIds) {
      permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
    }
  }

  if (button.staffRoleIds) {
    for (const roleId of button.staffRoleIds) {
      if (!permissionOverwrites.find(p => p.id === roleId)) {
        permissionOverwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
      }
    }
  }

  const channel = await guild.channels.create({
    name: `ticket-${interaction.user.username.slice(0, 25)}`,
    type: ChannelType.GuildText,
    parent: button.categoryId || ticketConfig?.categoryId || null,
    permissionOverwrites,
  });

  let user = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    user = await client.prisma.user.create({
      data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar },
    });
  }

  // Zapisz ticket z informacją o rolach do pingowania i WŁASNEJ WIADOMOŚCI DLA STAFFU
  await client.prisma.ticket.create({
    data: { 
      guildId: button.panel.guildId, 
      channelId: channel.id, 
      userId: user.id, 
      subject: button.label,
      staffRoleIds: button.pingRoleIds || [],
      staffMessage: button.staffMessage || 'Administracja potrzebna natychmiast!'
    },
  });

  const welcomeEmbed = new EmbedBuilder()
    .setTitle(button.ticketTitle || `Ticket: ${button.label}`)
    .setDescription(button.message || 'Witaj! Zaraz ktoś Ci pomoże. Opisz swój problem poniżej.')
    .setColor(button.ticketColor || '#6366f1');

  if (button.ticketFooter) welcomeEmbed.setFooter({ text: button.ticketFooter });
  welcomeEmbed.setTimestamp();

  const components = [];
  const controlsRow = new ActionRowBuilder<ButtonBuilder>();
  
  if (button.showCloseButton !== false) {
    controlsRow.addComponents(new ButtonBuilder()
      .setCustomId(`ticket:close:${channel.id}`)
      .setLabel(button.closeButtonLabel || 'Zamknij Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒'));
  }
  
  if (button.showStaffButton !== false) {
    controlsRow.addComponents(new ButtonBuilder()
      .setCustomId(`ticket:staff:${channel.id}`)
      .setLabel(button.staffButtonLabel || 'Wezwij Administrację')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔔'));
  }

  if (controlsRow.components.length > 0) components.push(controlsRow);

  const messageOptions: any = {
    embeds: [welcomeEmbed],
    components: components as any,
  };

  if (button.showWelcomeMessage !== false) {
    messageOptions.content = `${interaction.user}`;
  }

  await channel.send(messageOptions);

  if (interaction.deferred) {
    await interaction.editReply({ content: `Twój ticket został otwarty: ${channel}` });
  }
}

async function handleAddRole(client: BotClient, interaction: ButtonInteraction, button: any) {
  const member = interaction.member;
  if (!member || !('roles' in member)) return;
  const rolesToAdd = button.addRoleIds;
  if (!rolesToAdd || rolesToAdd.length === 0) return;
  try {
    await (member as any).roles.add(rolesToAdd);
    if (!interaction.deferred && !interaction.replied) {
      await interaction.reply({ content: `Nadano role: ${rolesToAdd.map((id: string) => `<@&${id}>`).join(', ')}`, flags: [MessageFlags.Ephemeral] });
    }
  } catch (err: any) {
    logger.error(`Błąd nadawania ról: ${err.message}`);
  }
}

async function handleSendMessage(client: BotClient, interaction: ButtonInteraction, button: any) {
  if (!button.message) return;
  if (!interaction.deferred && !interaction.replied) {
    await interaction.reply({ content: button.message, flags: [MessageFlags.Ephemeral] });
  }
}

async function handleLegacyCreateTicket(client: BotClient, interaction: ButtonInteraction) {
  const guild = await client.prisma.guild.findUnique({
    where: { discordId: interaction.guildId! },
    include: { ticketConfig: true },
  });
  if (!guild || !guild.ticketConfig) {
    await interaction.reply({ content: 'System ticketów nie jest skonfigurowany.', flags: [MessageFlags.Ephemeral] });
    return;
  }

  let user = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
  if (!user) {
    user = await client.prisma.user.create({
      data: { discordId: interaction.user.id, username: interaction.user.username, avatar: interaction.user.avatar },
    });
  }

  const openTickets = await client.prisma.ticket.count({
    where: { guildId: guild.id, userId: user.id, status: { not: 'CLOSED' } },
  });
  if (openTickets >= guild.ticketConfig.maxTicketsPerUser) {
    await interaction.reply({ content: 'Masz za dużo otwartych ticketów.', flags: [MessageFlags.Ephemeral] });
    return;
  }

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
    data: { guildId: guild.id, channelId: channel.id, userId: user.id, subject: 'Pomoc' },
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId('ticket_close').setLabel('🔒 Zamknij ticket').setStyle(ButtonStyle.Danger),
  );

  const embed = new EmbedBuilder()
    .setTitle(`🎫 Ticket — Pomoc`)
    .setDescription(`Utworzony przez <@${interaction.user.id}>\n\nOpisz swój problem, zespół wsparcia wkrótce odpowie.`)
    .setColor('#6366f1');

  await channel.send({ embeds: [embed], components: [row] });
  await interaction.reply({ content: `Twój ticket został otwarty: <#${channel.id}>`, flags: [MessageFlags.Ephemeral] });
}
