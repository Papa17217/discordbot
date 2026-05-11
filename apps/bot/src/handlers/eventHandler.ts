// ============================================
// Event Handler — Dynamic Loader
// ============================================

import * as fs from 'fs';
import * as path from 'path';
import type { BotClient } from '../client';
import type { Event } from '../structures/Event';
import { logger } from '../utils/logger';

export async function loadEvents(client: BotClient) {
  const eventsPath = path.join(__dirname, '..', 'events');

  if (!fs.existsSync(eventsPath)) {
    logger.warn('⚠️ Folder events nie istnieje');
    return;
  }

  const isTS = __filename.endsWith('.ts');
  const eventFiles = fs.readdirSync(eventsPath).filter(
    (file) => (isTS && file.endsWith('.ts')) || (!isTS && file.endsWith('.js')),
  );

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);

    try {
      const module = require(filePath);
      const EventClass = module.default || module[Object.keys(module)[0]];

      if (!EventClass) continue;

      const event: Event = new EventClass();

      if (event.once) {
        client.once(event.name, (...args) => event.execute(client, ...args));
      } else {
        client.on(event.name, (...args) => event.execute(client, ...args));
      }

      logger.info(`📡 Załadowano event: ${event.name} ${event.once ? '(once)' : ''}`);
    } catch (error) {
      logger.error(`❌ Błąd ładowania eventu ${file}:`, error);
    }
  }
}
