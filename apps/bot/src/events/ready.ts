// ============================================
// Event: Ready
// ============================================

import { Event } from '../structures/Event';
import { deployCommands } from '../handlers/commandHandler';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class ReadyEvent extends Event<'ready'> {
  constructor() {
    super({ name: 'ready', once: true });
  }

  async execute(client: BotClient) {
    logger.info(`✅ Zalogowano jako ${client.user?.tag}`);
    logger.info(`📊 Serwery: ${client.guilds.cache.size}`);
    logger.info(`👥 Użytkownicy: ${client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`);

    // Ustaw status
    client.setPresence();

    // Zarejestruj slash commands
    await deployCommands(client);

    // Aktualizuj status co 5 minut
    setInterval(() => client.setPresence(), 5 * 60 * 1000);

    // Synchronizuj guildy z bazą
    for (const [, guild] of client.guilds.cache) {
      try {
        // 1. Upewnij się, że właściciel istnieje
        await client.prisma.user.upsert({
          where: { discordId: guild.ownerId },
          update: {},
          create: {
            discordId: guild.ownerId,
            username: 'Unknown Owner',
          },
        });

        // 2. Synchronizuj serwer
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

        logger.error(`Błąd synchronizacji ${guild.name}:`, error);
      }
    }

    logger.info('✅ Synchronizacja guildów zakończona');
  }
}
