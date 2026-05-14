import type { BotType } from '../../modules/bot/bot.service';

/**
 * Parses dashboard header `x-active-bot` (PRIVATE|PUBLIC or private|public).
 */
export function parseActiveBotHeader(header?: string): BotType {
  const v = header?.trim().toLowerCase();
  if (v === 'public') return 'public';
  return 'private';
}
