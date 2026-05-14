// ============================================
// Event: GuildDelete — Bot usunięty z serwera
// ============================================

import { Event } from '../structures/Event';
import { Guild } from 'discord.js';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class GuildDeleteEvent extends Event<'guildDelete'> {
  constructor() {
    super({ name: 'guildDelete' });
  }

  async execute(client: BotClient, guild: Guild) {
    logger.info(`📤 Bot usunięty z: ${guild.name} (${guild.id})`);
    client.setPresence();
  }
}
