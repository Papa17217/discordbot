// ============================================
// Event: GuildCreate — Bot dołączył do serwera
// ============================================

import { Event } from '../structures/Event';
import { Guild } from 'discord.js';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class GuildCreateEvent extends Event<'guildCreate'> {
  constructor() {
    super({ name: 'guildCreate' });
  }

  async execute(client: BotClient, guild: Guild) {
    logger.info(`📥 Bot dołączył do: ${guild.name} (${guild.id}) — ${guild.memberCount} członków`);

    try {
      await client.prisma.guild.upsert({
        where: { discordId: guild.id },
        update: { name: guild.name, icon: guild.icon, memberCount: guild.memberCount },
        create: {
          discordId: guild.id,
          name: guild.name,
          icon: guild.icon,
          ownerId: guild.ownerId,
          memberCount: guild.memberCount,
          config: { create: {} },
        },
      });
    } catch (error) {
      logger.error('Błąd tworzenia guildu w bazie:', error);
    }

    client.setPresence();
  }
}
