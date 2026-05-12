import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BotService } from '../bot/bot.service';
import { randomUUID } from 'crypto';

@Injectable()
export class PanelsService {
  private readonly logger = new Logger(PanelsService.name);

  constructor(
    private prisma: PrismaService,
    private botService: BotService,
  ) {}

  async getPanels(guildId: string) {
    return this.prisma.ticketPanel.findMany({
      where: { guildId },
      include: { buttons: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPanel(panelId: string) {
    const panel = await this.prisma.ticketPanel.findUnique({
      where: { id: panelId },
      include: { buttons: true },
    });
    if (!panel) throw new NotFoundException('Panel nie znaleziony');
    return panel;
  }

  async createPanel(guildId: string, data: any) {
    const { title, description, color, footer, thumbnail, image, channelId, buttons, style, placeholder } = data;

    const panel = await this.prisma.ticketPanel.create({
      data: {
        guildId,
        channelId,
        title,
        description,
        color: color || '#6366f1',
        footer,
        thumbnail,
        image,
        style: style || 'BUTTON',
        placeholder: placeholder || 'Wybierz kategorię...',
        buttons: {
          create: buttons.map((btn: any) => ({
            label: btn.label,
            emoji: btn.emoji || null,
            style: btn.style || 'PRIMARY',
            actions: btn.actions || ['OPEN_TICKET'],
            customId: `ticket:${randomUUID()}`,
            pingRoleIds: btn.pingRoleIds || [],
            staffRoleIds: btn.staffRoleIds || [],
            addRoleIds: btn.addRoleIds || [],
            ticketTitle: btn.ticketTitle || null,
            message: btn.message || null,
            ticketFooter: btn.ticketFooter || null,
            ticketColor: btn.ticketColor || '#6366f1',
            showWelcomeMessage: btn.showWelcomeMessage !== undefined ? btn.showWelcomeMessage : true,
            showCloseButton: btn.showCloseButton !== undefined ? btn.showCloseButton : true,
            showStaffButton: btn.showStaffButton !== undefined ? btn.showStaffButton : true,
            closeButtonLabel: btn.closeButtonLabel || 'Zamknij Ticket',
            staffButtonLabel: btn.staffButtonLabel || 'Wezwij Administrację',
            staffMessage: btn.staffMessage || 'Administracja potrzebna natychmiast!',
            categoryId: btn.categoryId || null,
            namingFormat: btn.namingFormat || 'ticket-{username}',
          })),
        },
      },
      include: { buttons: true },
    });

    try {
      const guild = await this.prisma.guild.findUnique({
        where: { id: guildId },
        select: { discordId: true },
      });

      if (!guild) throw new NotFoundException('Serwer nie znaleziony w bazie');

      const result = await this.botService.sendTicketPanel(guild.discordId, channelId, {
        title,
        description,
        color: color || '#6366f1',
        footer: panel.footer,
        thumbnail: panel.thumbnail,
        image: panel.image,
        style: panel.style,
        placeholder: panel.placeholder,
      }, panel.buttons) as any;

      await this.prisma.ticketPanel.update({
        where: { id: panel.id },
        data: { messageId: result.messageId },
      });
      
      return { ...panel, messageId: result.messageId };
    } catch (error: any) {
      this.logger.error(`Błąd podczas wysyłania panelu przez bota: ${error.message}`);
      return panel;
    }
  }

  async updatePanel(panelId: string, data: any) {
    const { title, description, color, footer, thumbnail, image, channelId, buttons, style, placeholder } = data;

    // 1. Znajdź stary panel
    const existing = await this.prisma.ticketPanel.findUnique({
      where: { id: panelId },
      include: { buttons: true },
    });
    if (!existing) throw new NotFoundException('Panel nie znaleziony');

    // 2. Aktualizuj w bazie (usuń stare przyciski i dodaj nowe)
    const updated = await this.prisma.ticketPanel.update({
      where: { id: panelId },
      data: {
        title,
        description,
        color: color || '#6366f1',
        footer,
        thumbnail,
        image,
        channelId,
        style: style || 'BUTTON',
        placeholder: placeholder || 'Wybierz kategorię...',
        buttons: {
          deleteMany: {},
          create: buttons.map((btn: any) => ({
            label: btn.label,
            emoji: btn.emoji || null,
            style: btn.style || 'PRIMARY',
            actions: btn.actions || ['OPEN_TICKET'],
            customId: btn.customId || `ticket:${randomUUID()}`, // Zachowaj customId jeśli istnieje
            pingRoleIds: btn.pingRoleIds || [],
            staffRoleIds: btn.staffRoleIds || [],
            addRoleIds: btn.addRoleIds || [],
            ticketTitle: btn.ticketTitle || null,
            message: btn.message || null,
            ticketFooter: btn.ticketFooter || null,
            ticketColor: btn.ticketColor || '#6366f1',
            showWelcomeMessage: btn.showWelcomeMessage !== undefined ? btn.showWelcomeMessage : true,
            showCloseButton: btn.showCloseButton !== undefined ? btn.showCloseButton : true,
            showStaffButton: btn.showStaffButton !== undefined ? btn.showStaffButton : true,
            closeButtonLabel: btn.closeButtonLabel || 'Zamknij Ticket',
            staffButtonLabel: btn.staffButtonLabel || 'Wezwij Administrację',
            staffMessage: btn.staffMessage || 'Administracja potrzebna natychmiast!',
            categoryId: btn.categoryId || null,
            namingFormat: btn.namingFormat || 'ticket-{username}',
          })),
        },
      },
      include: { buttons: true },
    });

    // 3. Edytuj wiadomość na Discordzie
    if (updated.messageId) {
      try {
        const guild = await this.prisma.guild.findUnique({
          where: { id: updated.guildId },
          select: { discordId: true },
        });

        if (guild) {
          await this.botService.editTicketPanel(
            guild.discordId,
            updated.channelId,
            updated.messageId,
            { title, description, color, footer, thumbnail, image, style: updated.style, placeholder: updated.placeholder },
            updated.buttons
          );
        }
      } catch (error: any) {
        this.logger.error(`Błąd edycji panelu na Discordzie: ${error.message}`);
      }
    }

    return updated;
  }


  async deletePanel(panelId: string) {
    const panel = await this.prisma.ticketPanel.findUnique({ where: { id: panelId } });
    if (!panel) throw new NotFoundException('Panel nie znaleziony');

    return this.prisma.ticketPanel.delete({ where: { id: panelId } });
  }
}
