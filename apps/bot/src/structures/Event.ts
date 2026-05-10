// ============================================
// Base Event Structure
// ============================================

import type { ClientEvents } from 'discord.js';
import type { BotClient } from '../client';

export interface EventOptions<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
}

export abstract class Event<K extends keyof ClientEvents = keyof ClientEvents> {
  public name: K;
  public once: boolean;

  constructor(options: EventOptions<K>) {
    this.name = options.name;
    this.once = options.once ?? false;
  }

  abstract execute(client: BotClient, ...args: ClientEvents[K]): Promise<void>;
}
