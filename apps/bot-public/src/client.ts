// ============================================
// Extended Discord Client — Public Bot
// ============================================

import {
  Client,
  GatewayIntentBits,
  Collection,
  Partials,
  ActivityType,
} from 'discord.js';
import { loadCommands } from './handlers/commandHandler';
import { loadEvents } from './handlers/eventHandler';
import { logger } from './utils/logger';
import { prisma } from './utils/database';
import { redis } from './utils/redis';
import type { Command } from './structures/Command';

export class BotClient extends Client {
  public commands: Collection<string, Command> = new Collection();
  public cooldowns: Collection<string, Collection<string, number>> = new Collection();
  public prisma = prisma;
  public redis = redis;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
      ],
      allowedMentions: { parse: ['users', 'roles'], repliedUser: true },
    });
  }

  async start() {
    // Publiczny bot używa DISCORD_TOKEN_PUBLIC
    const token = process.env.DISCORD_TOKEN_PUBLIC;
    if (!token) {
      throw new Error('DISCORD_TOKEN_PUBLIC nie jest ustawiony!');
    }

    // Załaduj komendy i eventy
    await loadCommands(this);
    await loadEvents(this);

    // Połącz z bazą danych
    await this.prisma.$connect();
    logger.info('✅ Połączono z bazą danych');

    // Zaloguj bota
    await this.login(token);
  }

  setPresence() {
    this.user?.setPresence({
      activities: [
        {
          name: `${this.guilds.cache.size} serwerów`,
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });
  }
}
