// ============================================
// Command Handler — Dynamic Loader
// ============================================

import * as fs from 'fs';
import * as path from 'path';
import { REST, Routes } from 'discord.js';
import type { BotClient } from '../client';
import type { Command } from '../structures/Command';
import { logger } from '../utils/logger';

export async function loadCommands(client: BotClient) {
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    logger.warn('⚠️ Folder commands nie istnieje');
    return;
  }

  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    const stat = fs.statSync(categoryPath);

    if (!stat.isDirectory()) continue;

    const commandFiles = fs.readdirSync(categoryPath).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js'),
    );

    for (const file of commandFiles) {
      const filePath = path.join(categoryPath, file);

      try {
        const module = require(filePath);
        const CommandClass = module.default || module[Object.keys(module)[0]];

        if (!CommandClass) continue;

        const command: Command = new CommandClass();

        if (command.data) {
          client.commands.set(command.data.name, command);
          logger.info(`📦 Załadowano komendę: /${command.data.name} [${category}]`);
        }
      } catch (error) {
        logger.error(`❌ Błąd ładowania komendy ${file}:`, error);
      }
    }
  }

  logger.info(`✅ Załadowano ${client.commands.size} komend`);
}

export async function deployCommands(client: BotClient) {
  const commands = client.commands.map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

  try {
    logger.info(`🔄 Rejestruję ${commands.length} slash komend...`);

    await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
      { body: commands },
    );

    logger.info('✅ Komendy zarejestrowane!');
  } catch (error) {
    logger.error('❌ Błąd rejestracji komend:', error);
  }
}
