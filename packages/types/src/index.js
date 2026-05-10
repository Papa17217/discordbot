"use strict";
// ============================================
// @discord-saas/types — Shared TypeScript Types
// ============================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketEvent = exports.AutoModActionType = exports.AutoModRuleType = exports.TransactionType = exports.TicketStatus = exports.ModerationAction = exports.SubscriptionTier = exports.PermissionLevel = void 0;
// ── Enums ──────────────────────────────────
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["USER"] = "USER";
    PermissionLevel["MOD"] = "MOD";
    PermissionLevel["ADMIN"] = "ADMIN";
    PermissionLevel["OWNER"] = "OWNER";
    PermissionLevel["SUPER_ADMIN"] = "SUPER_ADMIN";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier["FREE"] = "FREE";
    SubscriptionTier["PREMIUM"] = "PREMIUM";
    SubscriptionTier["ENTERPRISE"] = "ENTERPRISE";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var ModerationAction;
(function (ModerationAction) {
    ModerationAction["WARN"] = "WARN";
    ModerationAction["MUTE"] = "MUTE";
    ModerationAction["KICK"] = "KICK";
    ModerationAction["BAN"] = "BAN";
    ModerationAction["UNMUTE"] = "UNMUTE";
    ModerationAction["UNBAN"] = "UNBAN";
    ModerationAction["PURGE"] = "PURGE";
})(ModerationAction || (exports.ModerationAction = ModerationAction = {}));
var TicketStatus;
(function (TicketStatus) {
    TicketStatus["OPEN"] = "OPEN";
    TicketStatus["CLAIMED"] = "CLAIMED";
    TicketStatus["CLOSED"] = "CLOSED";
})(TicketStatus || (exports.TicketStatus = TicketStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["DAILY"] = "DAILY";
    TransactionType["TRANSFER"] = "TRANSFER";
    TransactionType["SHOP_PURCHASE"] = "SHOP_PURCHASE";
    TransactionType["REWARD"] = "REWARD";
    TransactionType["PENALTY"] = "PENALTY";
    TransactionType["GAMBLING"] = "GAMBLING";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var AutoModRuleType;
(function (AutoModRuleType) {
    AutoModRuleType["WORD_FILTER"] = "WORD_FILTER";
    AutoModRuleType["SPAM_FILTER"] = "SPAM_FILTER";
    AutoModRuleType["LINK_FILTER"] = "LINK_FILTER";
    AutoModRuleType["CAPS_FILTER"] = "CAPS_FILTER";
    AutoModRuleType["EMOJI_FILTER"] = "EMOJI_FILTER";
    AutoModRuleType["MENTION_FILTER"] = "MENTION_FILTER";
    AutoModRuleType["INVITE_FILTER"] = "INVITE_FILTER";
})(AutoModRuleType || (exports.AutoModRuleType = AutoModRuleType = {}));
var AutoModActionType;
(function (AutoModActionType) {
    AutoModActionType["DELETE"] = "DELETE";
    AutoModActionType["WARN"] = "WARN";
    AutoModActionType["MUTE"] = "MUTE";
    AutoModActionType["KICK"] = "KICK";
})(AutoModActionType || (exports.AutoModActionType = AutoModActionType = {}));
var WebSocketEvent;
(function (WebSocketEvent) {
    // Bot status
    WebSocketEvent["BOT_STATUS"] = "bot:status";
    WebSocketEvent["BOT_READY"] = "bot:ready";
    WebSocketEvent["BOT_ERROR"] = "bot:error";
    // Guild events
    WebSocketEvent["GUILD_STATS_UPDATE"] = "guild:stats:update";
    WebSocketEvent["GUILD_CONFIG_UPDATE"] = "guild:config:update";
    WebSocketEvent["GUILD_MEMBER_JOIN"] = "guild:member:join";
    WebSocketEvent["GUILD_MEMBER_LEAVE"] = "guild:member:leave";
    // Moderation
    WebSocketEvent["MODERATION_ACTION"] = "moderation:action";
    // Analytics
    WebSocketEvent["ANALYTICS_UPDATE"] = "analytics:update";
    WebSocketEvent["ANALYTICS_COMMAND"] = "analytics:command";
    // Tickets
    WebSocketEvent["TICKET_CREATE"] = "ticket:create";
    WebSocketEvent["TICKET_CLOSE"] = "ticket:close";
})(WebSocketEvent || (exports.WebSocketEvent = WebSocketEvent = {}));
//# sourceMappingURL=index.js.map