// ============================================
// @discord-saas/shared — Shared Utilities
// ============================================

import { z } from 'zod';

// ── Constants ──────────────────────────────

export const COLORS = {
  PRIMARY: '#6366f1',
  SECONDARY: '#8b5cf6',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  EMBED_DEFAULT: '#5865F2',
  EMBED_SUCCESS: '#57F287',
  EMBED_WARNING: '#FEE75C',
  EMBED_ERROR: '#ED4245',
  EMBED_INFO: '#5865F2',
} as const;

export const LIMITS = {
  MAX_GUILDS_PER_USER: 100,
  MAX_TICKETS_PER_USER: 3,
  MAX_WARNINGS_BEFORE_BAN: 5,
  MAX_SHOP_ITEMS: 50,
  MAX_REACTION_ROLES: 20,
  MAX_AUTOMOD_RULES: 15,
  MAX_LEVEL_REWARDS: 25,
  XP_COOLDOWN_MS: 60_000,
  DAILY_COOLDOWN_MS: 86_400_000,
  EMBED_DESCRIPTION_MAX: 4096,
  EMBED_FIELD_VALUE_MAX: 1024,
  COMMAND_COOLDOWN_DEFAULT_MS: 3_000,
  ANTI_SPAM_THRESHOLD: 5,
  ANTI_SPAM_INTERVAL_MS: 5_000,
} as const;

export const DEFAULTS = {
  PREFIX: '!',
  LANGUAGE: 'pl',
  CURRENCY_NAME: 'coins',
  CURRENCY_EMOJI: '💰',
  DAILY_AMOUNT: 100,
  STARTING_BALANCE: 0,
  XP_PER_MESSAGE: 15,
  XP_COOLDOWN_SECONDS: 60,
  LEVEL_UP_MESSAGE: '🎉 Gratulacje {user}! Osiągnąłeś poziom **{level}**!',
  WELCOME_MESSAGE: '👋 Witaj na serwerze, {user}! Jesteś {memberCount}. członkiem!',
  LEAVE_MESSAGE: '😢 {user} opuścił serwer.',
  TICKET_MESSAGE: '📩 Kliknij przycisk poniżej, aby utworzyć ticket.',
} as const;

export const CACHE_TTL = {
  GUILD_CONFIG: 300,       // 5 min
  USER_PROFILE: 120,       // 2 min
  GUILD_STATS: 60,         // 1 min
  BOT_STATUS: 30,          // 30s
  COMMAND_COOLDOWN: 5,     // 5s
  ANALYTICS: 120,          // 2 min
} as const;

// ── Utility Functions ──────────────────────

export function generateId(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const d = new Date(date);
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d temu`;
  if (hours > 0) return `${hours}h temu`;
  if (minutes > 0) return `${minutes}m temu`;
  return `${seconds}s temu`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

export function formatUptime(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0) parts.push(`${seconds % 60}s`);

  return parts.join(' ') || '0s';
}

export function calculateXpForLevel(level: number): number {
  return 5 * (level * level) + 50 * level + 100;
}

export function calculateLevelFromXp(xp: number): number {
  let level = 0;
  let totalXp = 0;
  while (totalXp + calculateXpForLevel(level) <= xp) {
    totalXp += calculateXpForLevel(level);
    level++;
  }
  return level;
}

export function getDiscordAvatarUrl(userId: string, avatar: string | null, size = 128): string {
  if (!avatar) {
    const index = (BigInt(userId) >> 22n) % 6n;
    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  }
  const ext = avatar.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}?size=${size}`;
}

export function getDiscordGuildIconUrl(guildId: string, icon: string | null, size = 128): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=${size}`;
}

export function parseDuration(input: string): number | null {
  const regex = /^(\d+)(s|m|h|d|w)$/;
  const match = input.match(regex);
  if (!match) return null;

  const value = parseInt(match[1]);
  const unit = match[2];

  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };

  return value * (multipliers[unit] || 0);
}

export function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

// ── Zod Validation Schemas ─────────────────

export const guildConfigSchema = z.object({
  prefix: z.string().min(1).max(5).default('!'),
  language: z.string().default('pl'),
  moderationEnabled: z.boolean().default(true),
  economyEnabled: z.boolean().default(false),
  levelsEnabled: z.boolean().default(false),
  ticketsEnabled: z.boolean().default(false),
  welcomeEnabled: z.boolean().default(false),
  automodEnabled: z.boolean().default(false),
  loggingEnabled: z.boolean().default(true),
  reactionRolesEnabled: z.boolean().default(false),
  giveawaysEnabled: z.boolean().default(false),
  verificationEnabled: z.boolean().default(false),
  tempVoiceEnabled: z.boolean().default(false),
  aiEnabled: z.boolean().default(false),
  logChannelId: z.string().nullable().default(null),
  modRoleIds: z.array(z.string()).default([]),
  adminRoleIds: z.array(z.string()).default([]),
});

export const welcomeConfigSchema = z.object({
  channelId: z.string().nullable().default(null),
  message: z.string().max(2000).default(DEFAULTS.WELCOME_MESSAGE),
  embedEnabled: z.boolean().default(false),
  embedColor: z.string().default(COLORS.PRIMARY),
  embedTitle: z.string().max(256).default('Witaj!'),
  embedDescription: z.string().max(4096).default(''),
  embedImage: z.string().nullable().default(null),
  dmEnabled: z.boolean().default(false),
  dmMessage: z.string().max(2000).default(''),
  leaveChannelId: z.string().nullable().default(null),
  leaveMessage: z.string().max(2000).default(DEFAULTS.LEAVE_MESSAGE),
  autoRoleIds: z.array(z.string()).default([]),
});

export const economyConfigSchema = z.object({
  currencyName: z.string().max(50).default(DEFAULTS.CURRENCY_NAME),
  currencyEmoji: z.string().max(50).default(DEFAULTS.CURRENCY_EMOJI),
  dailyAmount: z.number().min(1).max(100000).default(DEFAULTS.DAILY_AMOUNT),
  dailyCooldown: z.number().min(3600000).default(LIMITS.DAILY_COOLDOWN_MS),
  startingBalance: z.number().min(0).default(DEFAULTS.STARTING_BALANCE),
  maxBalance: z.number().min(1).default(1000000),
});

export const levelConfigSchema = z.object({
  xpPerMessage: z.number().min(1).max(100).default(DEFAULTS.XP_PER_MESSAGE),
  xpCooldown: z.number().min(0).max(300).default(DEFAULTS.XP_COOLDOWN_SECONDS),
  levelUpChannelId: z.string().nullable().default(null),
  levelUpMessage: z.string().max(2000).default(DEFAULTS.LEVEL_UP_MESSAGE),
  noXpChannelIds: z.array(z.string()).default([]),
  noXpRoleIds: z.array(z.string()).default([]),
});

export const ticketConfigSchema = z.object({
  categoryId: z.string().nullable().default(null),
  supportRoleIds: z.array(z.string()).default([]),
  logChannelId: z.string().nullable().default(null),
  maxTicketsPerUser: z.number().min(1).max(10).default(LIMITS.MAX_TICKETS_PER_USER),
  ticketMessage: z.string().max(2000).default(DEFAULTS.TICKET_MESSAGE),
  closeConfirmation: z.boolean().default(true),
  transcriptsEnabled: z.boolean().default(true),
});

export const autoModRuleSchema = z.object({
  type: z.nativeEnum(z.enum([
    'WORD_FILTER', 'SPAM_FILTER', 'LINK_FILTER', 'CAPS_FILTER',
    'EMOJI_FILTER', 'MENTION_FILTER', 'INVITE_FILTER',
  ]).enum),
  enabled: z.boolean().default(true),
  action: z.enum(['DELETE', 'WARN', 'MUTE', 'KICK']).default('DELETE'),
  threshold: z.number().min(1).max(100).default(5),
  duration: z.number().nullable().default(null),
  whitelist: z.array(z.string()).default([]),
  blacklist: z.array(z.string()).default([]),
});
