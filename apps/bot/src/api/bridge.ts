// ============================================
// API Bridge — Internal HTTP API for Bot ↔ API
// ============================================

import express from 'express';
import { randomUUID } from 'crypto';
import type { BotClient } from '../client';
import { logger } from '../utils/logger';

export function startBridge(client: BotClient) {
  const app = express();
  app.use(express.json());

  const SECRET = process.env.BOT_API_SECRET || 'internal-bot-api-secret';

  // Middleware — weryfikacja secretu
  app.use((req, res, next) => {
    const token = req.headers['x-bot-secret'];
    if (token !== SECRET) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    next();
  });

  // ── Status bota ──────────────────────────
  app.get('/status', (req, res) => {
    res.json({
      online: client.isReady(),
      uptime: client.uptime || 0,
      guilds: client.guilds.cache.size,
      users: client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
      ping: client.ws.ping,
      memoryUsage: process.memoryUsage().heapUsed,
      version: require('../../package.json').version,
    });
  });

  // ── Informacje o guildzie ────────────────
  app.get('/guilds', (req, res) => {
    const guilds = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      memberCount: guild.memberCount,
    }));

    res.json(guilds);
  });

  app.get('/guilds/:guildId', (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.icon,
      memberCount: guild.memberCount,
      channels: guild.channels.cache.map((c) => ({ id: c.id, name: c.name, type: c.type })),
      roles: guild.roles.cache.map((r) => ({ id: r.id, name: r.name, color: r.hexColor, position: r.position })),
    });
  });

  // ── Lista kanałów guildu ─────────────────
  app.get('/guilds/:guildId/channels', (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const channels = guild.channels.cache.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      parentId: c.parentId,
    }));

    res.json(channels);
  });

  // ── Lista ról guildu ─────────────────────
  app.get('/guilds/:guildId/roles', (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
        managed: r.managed,
      }));

    res.json(roles);
  });

  // ── Odśwież cache konfig guildu ──────────
  app.post('/guilds/:guildId/refresh-config', async (req, res) => {
    try {
      await client.redis.del(`config:${req.params.guildId}`);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to refresh config' });
    }
  });

  // ── Wyślij panel ticketowy ────────────────
  app.post('/guilds/:guildId/tickets/send-panel', async (req, res) => {
    const { channelId, embed, buttons } = req.body;
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }

    try {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      const discordEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description || null)
        .setColor(embed.color || '#6366f1');

      if (embed.footer) discordEmbed.setFooter({ text: embed.footer });
      if (embed.thumbnail) discordEmbed.setThumbnail(embed.thumbnail);
      if (embed.image) discordEmbed.setImage(embed.image);

      const rows = [];
      if (buttons && buttons.length > 0) {
        if (embed.style === 'SELECT') {
          const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
          const select = new StringSelectMenuBuilder()
            .setCustomId(`ticket_select:${randomUUID()}`)
            .setPlaceholder(embed.placeholder || 'Wybierz kategorię...')
            .addOptions(
              buttons.slice(0, 25).map((btn: any) => {
                const option = new StringSelectMenuOptionBuilder()
                  .setLabel(btn.label)
                  .setValue(btn.customId);
                if (btn.emoji) option.setEmoji(btn.emoji);
                return option;
              })
            );
          rows.push(new ActionRowBuilder().addComponents(select));
        } else {
          // Split buttons into rows of 5 (Discord limit)
          for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder();
            buttons.slice(i, i + 5).forEach((btn: any) => {
              const button = new ButtonBuilder()
                .setCustomId(btn.customId)
                .setLabel(btn.label)
                .setStyle(ButtonStyle[btn.style as keyof typeof ButtonStyle] || ButtonStyle.Primary);
              
              if (btn.emoji) button.setEmoji(btn.emoji);
              row.addComponents(button);
            });
            rows.push(row);
          }
        }
      }

      const message = await (channel as any).send({
        embeds: [discordEmbed],
        components: rows,
      });


      res.json({ success: true, messageId: message.id });
    } catch (error: any) {
      logger.error(`Failed to send ticket panel: ${error.message}`);
      res.status(500).json({ error: 'Failed to send panel' });
    }
  });

  // ── Edytuj panel ticketowy ────────────────
  app.patch('/guilds/:guildId/tickets/panels/:messageId', async (req, res) => {
    const { channelId, embed, buttons } = req.body;
    const { messageId, guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }

    try {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      
      const message = await (channel as any).messages.fetch(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      const discordEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description || null)
        .setColor(embed.color || '#6366f1');

      if (embed.footer) discordEmbed.setFooter({ text: embed.footer });
      if (embed.thumbnail) discordEmbed.setThumbnail(embed.thumbnail);
      if (embed.image) discordEmbed.setImage(embed.image);

      const rows = [];
      if (buttons && buttons.length > 0) {
        if (embed.style === 'SELECT') {
          const { StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
          const select = new StringSelectMenuBuilder()
            .setCustomId(`ticket_select:${randomUUID()}`)
            .setPlaceholder(embed.placeholder || 'Wybierz kategorię...')
            .addOptions(
              buttons.slice(0, 25).map((btn: any) => {
                const option = new StringSelectMenuOptionBuilder()
                  .setLabel(btn.label)
                  .setValue(btn.customId);
                if (btn.emoji) option.setEmoji(btn.emoji);
                return option;
              })
            );
          rows.push(new ActionRowBuilder().addComponents(select));
        } else {
          // Split buttons into rows of 5 (Discord limit)
          for (let i = 0; i < buttons.length; i += 5) {
            const row = new ActionRowBuilder();
            buttons.slice(i, i + 5).forEach((btn: any) => {
              const button = new ButtonBuilder()
                .setCustomId(btn.customId)
                .setLabel(btn.label)
                .setStyle(ButtonStyle[btn.style as keyof typeof ButtonStyle] || ButtonStyle.Primary);
              
              if (btn.emoji) button.setEmoji(btn.emoji);
              row.addComponents(button);
            });
            rows.push(row);
          }
        }
      }

      await message.edit({
        embeds: [discordEmbed],
        components: rows,
      });


      res.json({ success: true });
    } catch (error: any) {
      logger.error(`Failed to edit ticket panel: ${error.message}`);
      res.status(500).json({ error: 'Failed to edit panel' });
    }
  });

  // ── Wyślij panel Reaction Role ────────────
  app.post('/guilds/:guildId/reaction-roles/panels', async (req, res) => {
    const { channelId, embed, buttons } = req.body;
    const guildId = req.params.guildId;
    console.log(`[BRIDGE] Request to send panel for guild: ${guildId}`);
    
    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      console.error(`[BRIDGE] Guild ${guildId} not found in bot cache! Total guilds: ${client.guilds.cache.size}`);
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }

    try {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

      const discordEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description || null)
        .setColor(embed.color || '#6366f1');

      if (embed.footer) discordEmbed.setFooter({ text: embed.footer });
      if (embed.thumbnail) discordEmbed.setThumbnail(embed.thumbnail);
      if (embed.image) discordEmbed.setImage(embed.image);

      const rows = [];
      if (buttons && buttons.length > 0) {
        // Discord allows max 5 buttons per row, 5 rows total
        for (let i = 0; i < buttons.length; i += 5) {
          const row = new ActionRowBuilder();
          const chunk = buttons.slice(i, i + 5);
          chunk.forEach((btn: any) => {
            // Mapowanie styli (obsługa zarówno UPPERCASE jak i CamelCase)
            const styleName = btn.style.charAt(0).toUpperCase() + btn.style.slice(1).toLowerCase();
            const buttonStyle = ButtonStyle[styleName as keyof typeof ButtonStyle] || ButtonStyle.Primary;

            const button = new ButtonBuilder()
              .setCustomId(`rr_${btn.roleId || Math.random().toString(36).substr(2, 9)}`)
              .setLabel(btn.label)
              .setStyle(buttonStyle);
            
            if (btn.emoji) button.setEmoji(btn.emoji);
            row.addComponents(button);
          });
          rows.push(row);
        }
      }

      const message = await (channel as any).send({
        embeds: [discordEmbed],
        components: rows,
      });

      res.json({ success: true, messageId: message.id });
    } catch (error: any) {
      logger.error(`Failed to send reaction panel: ${error.message}`);
      res.status(500).json({ error: 'Failed to send panel' });
    }
  });

  // ── Edytuj panel Reaction Role ────────────
  app.patch('/guilds/:guildId/reaction-roles/panels/:messageId', async (req, res) => {
    const { channelId, embed, buttons } = req.body;
    const { messageId, guildId } = req.params;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(404).json({ error: 'Guild not found' });
      return;
    }

    const channel = guild.channels.cache.get(channelId);
    if (!channel || !channel.isTextBased()) {
      res.status(400).json({ error: 'Invalid channel' });
      return;
    }

    try {
      const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
      
      const message = await (channel as any).messages.fetch(messageId);
      if (!message) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      const discordEmbed = new EmbedBuilder()
        .setTitle(embed.title)
        .setDescription(embed.description || null)
        .setColor(embed.color || '#6366f1');

      if (embed.footer) discordEmbed.setFooter({ text: embed.footer });
      if (embed.thumbnail) discordEmbed.setThumbnail(embed.thumbnail);
      if (embed.image) discordEmbed.setImage(embed.image);

      const rows = [];
      if (buttons && buttons.length > 0) {
        for (let i = 0; i < buttons.length; i += 5) {
          const row = new ActionRowBuilder();
          const chunk = buttons.slice(i, i + 5);
          chunk.forEach((btn: any) => {
            const styleName = btn.style.charAt(0).toUpperCase() + btn.style.slice(1).toLowerCase();
            const buttonStyle = ButtonStyle[styleName as keyof typeof ButtonStyle] || ButtonStyle.Primary;

            const button = new ButtonBuilder()
              .setCustomId(`rr_${btn.roleId || Math.random().toString(36).substr(2, 9)}`)
              .setLabel(btn.label)
              .setStyle(buttonStyle);
            
            if (btn.emoji) button.setEmoji(btn.emoji);
            row.addComponents(button);
          });
          rows.push(row);
        }
      }

      await message.edit({
        embeds: [discordEmbed],
        components: rows,
      });

      res.json({ success: true });
    } catch (error: any) {
      logger.error(`Failed to edit reaction panel: ${error.message}`);
      res.status(500).json({ error: 'Failed to edit panel' });
    }
  });

  // ── Start serwera ────────────────────────
  const port = process.env.BOT_API_PORT || 4001;
  app.listen(port, () => {
    logger.info(`🌉 Bot API Bridge działa na porcie ${port}`);
  });
}
