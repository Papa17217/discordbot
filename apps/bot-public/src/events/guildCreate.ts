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
      // 1. Najpierw upewnij się, że właściciel istnieje w bazie danych
      // Próbujemy pobrać właściciela, żeby mieć jego dane (opcjonalne, ale profesjonalne)
      let ownerUsername = 'Unknown Owner';
      try {
        const owner = await guild.fetchOwner();
        ownerUsername = owner.user.username;
      } catch (err) {
        logger.warn(`Nie udało się pobrać danych właściciela dla serwera ${guild.name}`);
      }

      await client.prisma.user.upsert({
        where: { discordId: guild.ownerId },
        update: { username: ownerUsername },
        create: {
          discordId: guild.ownerId,
          username: ownerUsername,
        },
      });

      // 2. Teraz możemy bezpiecznie dodać/zaktualizować serwer
      await client.prisma.guild.upsert({
        where: { discordId_botType: { discordId: guild.id , botType: 'PUBLIC' } },
        update: { name: guild.name, icon: guild.icon, memberCount: guild.memberCount },
        create: {
          discordId: guild.id,
          name: guild.name,
          icon: guild.icon,
          ownerId: guild.ownerId,
          memberCount: guild.memberCount,
          botType: 'PUBLIC',
          config: { create: {} },
        },
      });
    } catch (error) {

      logger.error('Błąd tworzenia guildu w bazie:', error);
    }

    client.setPresence();
  }
}
