// ============================================
// @discord-saas/types — Shared TypeScript Types
// ============================================

// ── Enums ──────────────────────────────────

export enum PermissionLevel {
  USER = 'USER',
  MOD = 'MOD',
  ADMIN = 'ADMIN',
  OWNER = 'OWNER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum ModerationAction {
  WARN = 'WARN',
  MUTE = 'MUTE',
  KICK = 'KICK',
  BAN = 'BAN',
  UNMUTE = 'UNMUTE',
  UNBAN = 'UNBAN',
  PURGE = 'PURGE',
}

export enum TicketStatus {
  OPEN = 'OPEN',
  CLAIMED = 'CLAIMED',
  CLOSED = 'CLOSED',
}

export enum TransactionType {
  DAILY = 'DAILY',
  TRANSFER = 'TRANSFER',
  SHOP_PURCHASE = 'SHOP_PURCHASE',
  REWARD = 'REWARD',
  PENALTY = 'PENALTY',
  GAMBLING = 'GAMBLING',
}

export enum AutoModRuleType {
  WORD_FILTER = 'WORD_FILTER',
  SPAM_FILTER = 'SPAM_FILTER',
  LINK_FILTER = 'LINK_FILTER',
  CAPS_FILTER = 'CAPS_FILTER',
  EMOJI_FILTER = 'EMOJI_FILTER',
  MENTION_FILTER = 'MENTION_FILTER',
  INVITE_FILTER = 'INVITE_FILTER',
}

export enum AutoModActionType {
  DELETE = 'DELETE',
  WARN = 'WARN',
  MUTE = 'MUTE',
  KICK = 'KICK',
}

export enum WebSocketEvent {
  // Bot status
  BOT_STATUS = 'bot:status',
  BOT_READY = 'bot:ready',
  BOT_ERROR = 'bot:error',

  // Guild events
  GUILD_STATS_UPDATE = 'guild:stats:update',
  GUILD_CONFIG_UPDATE = 'guild:config:update',
  GUILD_MEMBER_JOIN = 'guild:member:join',
  GUILD_MEMBER_LEAVE = 'guild:member:leave',

  // Moderation
  MODERATION_ACTION = 'moderation:action',

  // Analytics
  ANALYTICS_UPDATE = 'analytics:update',
  ANALYTICS_COMMAND = 'analytics:command',

  // Tickets
  TICKET_CREATE = 'ticket:create',
  TICKET_CLOSE = 'ticket:close',
}

// ── User Types ─────────────────────────────

export interface IUser {
  id: string;
  discordId: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  role: PermissionLevel;
  subscription: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile extends IUser {
  guilds: IGuildPartial[];
  totalServers: number;
}

// ── Guild Types ────────────────────────────

export interface IGuild {
  id: string;
  discordId: string;
  name: string;
  icon: string | null;
  ownerId: string;
  memberCount: number;
  premium: boolean;
  premiumTier: SubscriptionTier;
  joinedAt: Date;
  config: IGuildConfig;
}

export interface IGuildPartial {
  id: string;
  discordId: string;
  name: string;
  icon: string | null;
  memberCount: number;
  premium: boolean;
  botPresent: boolean;
  userPermissions: string;
}

export interface IGuildConfig {
  id: string;
  guildId: string;
  prefix: string;
  language: string;
  moderationEnabled: boolean;
  economyEnabled: boolean;
  levelsEnabled: boolean;
  ticketsEnabled: boolean;
  welcomeEnabled: boolean;
  automodEnabled: boolean;
  loggingEnabled: boolean;
  reactionRolesEnabled: boolean;
  giveawaysEnabled: boolean;
  verificationEnabled: boolean;
  tempVoiceEnabled: boolean;
  aiEnabled: boolean;
  logChannelId: string | null;
  modRoleIds: string[];
  adminRoleIds: string[];
}

// ── Module Configs ─────────────────────────

export interface IWelcomeConfig {
  guildId: string;
  channelId: string | null;
  message: string;
  embedEnabled: boolean;
  embedColor: string;
  embedTitle: string;
  embedDescription: string;
  embedImage: string | null;
  dmEnabled: boolean;
  dmMessage: string;
  leaveChannelId: string | null;
  leaveMessage: string;
  autoRoleIds: string[];
}

export interface IAutoModConfig {
  guildId: string;
  rules: IAutoModRule[];
  exemptRoleIds: string[];
  exemptChannelIds: string[];
  logChannelId: string | null;
}

export interface IAutoModRule {
  id: string;
  type: AutoModRuleType;
  enabled: boolean;
  action: AutoModActionType;
  threshold: number;
  duration: number | null;
  whitelist: string[];
  blacklist: string[];
}

export interface IEconomyConfig {
  guildId: string;
  currencyName: string;
  currencyEmoji: string;
  dailyAmount: number;
  dailyCooldown: number;
  startingBalance: number;
  maxBalance: number;
}

export interface ILevelConfig {
  guildId: string;
  xpPerMessage: number;
  xpCooldown: number;
  levelUpChannelId: string | null;
  levelUpMessage: string;
  noXpChannelIds: string[];
  noXpRoleIds: string[];
  rewards: ILevelReward[];
}

export interface ILevelReward {
  id: string;
  level: number;
  roleId: string;
  removeOnHigher: boolean;
}

export interface ITicketConfig {
  guildId: string;
  categoryId: string | null;
  supportRoleIds: string[];
  logChannelId: string | null;
  maxTicketsPerUser: number;
  ticketMessage: string;
  closeConfirmation: boolean;
  transcriptsEnabled: boolean;
}

// ── Moderation Types ───────────────────────

export interface IModerationLog {
  id: string;
  guildId: string;
  moderatorId: string;
  moderatorName: string;
  targetId: string;
  targetName: string;
  action: ModerationAction;
  reason: string | null;
  duration: number | null;
  createdAt: Date;
}

// ── Economy Types ──────────────────────────

export interface ITransaction {
  id: string;
  userId: string;
  guildId: string;
  amount: number;
  type: TransactionType;
  description: string;
  createdAt: Date;
}

export interface IShopItem {
  id: string;
  guildId: string;
  name: string;
  description: string;
  price: number;
  roleId: string | null;
  stock: number | null;
  enabled: boolean;
}

// ── Ticket Types ───────────────────────────

export interface ITicket {
  id: string;
  guildId: string;
  channelId: string;
  userId: string;
  userName: string;
  status: TicketStatus;
  subject: string;
  claimedById: string | null;
  claimedByName: string | null;
  createdAt: Date;
  closedAt: Date | null;
}

// ── Analytics Types ────────────────────────

export interface IGuildStats {
  totalMembers: number;
  onlineMembers: number;
  totalMessages: number;
  totalCommands: number;
  activeModerations: number;
  openTickets: number;
  economyTransactions: number;
  messagesPerDay: ITimeSeriesData[];
  commandsPerDay: ITimeSeriesData[];
  membersPerDay: ITimeSeriesData[];
  topCommands: ICommandUsageStat[];
  recentActions: IModerationLog[];
}

export interface ITimeSeriesData {
  date: string;
  value: number;
}

export interface ICommandUsageStat {
  command: string;
  count: number;
}

export interface IBotStatus {
  online: boolean;
  uptime: number;
  guilds: number;
  users: number;
  ping: number;
  memoryUsage: number;
  version: string;
}

// ── API Response Types ─────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

// ── Auth Types ─────────────────────────────

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IAuthUser {
  id: string;
  discordId: string;
  username: string;
  avatar: string | null;
  role: PermissionLevel;
  subscription: SubscriptionTier;
  /** Bot whitelist entries from API (e.g. PRIVATE, PUBLIC) */
  whitelist?: string[];
}

export interface IDiscordOAuthUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email: string | null;
  accessToken: string;
  refreshToken: string;
}

// ── Premium Types ──────────────────────────

export interface ISubscription {
  id: string;
  userId: string;
  guildId: string | null;
  tier: SubscriptionTier;
  active: boolean;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface IFeatureFlag {
  name: string;
  enabled: boolean;
  premiumOnly: boolean;
  description: string;
}

// ── Reaction Roles ─────────────────────────

export interface IReactionRole {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  emoji: string;
  roleId: string;
  roleName: string;
}

// ── Giveaway ───────────────────────────────

export interface IGiveaway {
  id: string;
  guildId: string;
  channelId: string;
  messageId: string;
  prize: string;
  winnersCount: number;
  endTime: Date;
  ended: boolean;
  hostId: string;
  hostName: string;
  entries: number;
}
