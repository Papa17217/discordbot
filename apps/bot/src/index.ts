// ============================================
// Discord Bot — Entry Point
// ============================================

import { BotClient } from './client';
import { logger } from './utils/logger';
import { startBridge } from './api/bridge';

async function main() {
  logger.info('🤖 Uruchamianie bota Discord...');

  const client = new BotClient();

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`📴 Otrzymano ${signal} — zamykanie...`);
    client.destroy();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    process.exit(1);
  });

  try {
    // Start bot
    await client.start();

    // Start internal API bridge
    startBridge(client);

    logger.info('✅ Bot uruchomiony pomyślnie!');
  } catch (error) {
    logger.error('❌ Błąd uruchamiania bota:', error);
    process.exit(1);
  }
}

main();
