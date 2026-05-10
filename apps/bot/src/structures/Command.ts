// ============================================
// Base Command Structure
// ============================================

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { BotClient } from '../client';

export interface CommandOptions {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
  cooldown?: number; // sekundy
  premium?: boolean;
  permissions?: bigint[];
  module?: string;
}

export abstract class Command {
  public data: CommandOptions['data'];
  public cooldown: number;
  public premium: boolean;
  public permissions: bigint[];
  public module: string;

  constructor(options: CommandOptions) {
    this.data = options.data;
    this.cooldown = options.cooldown ?? 3;
    this.premium = options.premium ?? false;
    this.permissions = options.permissions ?? [];
    this.module = options.module ?? 'general';
  }

  abstract execute(interaction: ChatInputCommandInteraction, client: BotClient): Promise<void>;
}
