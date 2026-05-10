// ============================================
// Deploy Commands Script
// ============================================

import { REST, Routes } from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

async function deploy() {
  const token = process.env.DISCORD_TOKEN;
  const clientId = process.env.DISCORD_CLIENT_ID;

  if (!token || !clientId) {
    console.error('❌ Brak DISCORD_TOKEN lub DISCORD_CLIENT_ID');
    process.exit(1);
  }

  const commands: any[] = [];
  const commandsPath = path.join(__dirname, '..', 'commands');
  const categories = fs.readdirSync(commandsPath);

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    const files = fs.readdirSync(categoryPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

    for (const file of files) {
      const module = require(path.join(categoryPath, file));
      const CmdClass = module.default || module[Object.keys(module)[0]];
      if (CmdClass) {
        const cmd = new CmdClass();
        commands.push(cmd.data.toJSON());
      }
    }
  }

  const rest = new REST({ version: '10' }).setToken(token);

  console.log(`🔄 Rejestruję ${commands.length} komend...`);
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('✅ Gotowe!');
}

deploy().catch(console.error);
