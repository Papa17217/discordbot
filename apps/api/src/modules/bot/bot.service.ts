import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type BotType = 'private' | 'public';
export interface BridgeGuildSummary {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
}

@Injectable()
export class BotService {
  private readonly botUrls: Record<BotType, string>;
  private readonly secrets: Record<BotType, string>;
  private readonly logger = new Logger(BotService.name);

  constructor(private configService: ConfigService) {
    const privatePort = this.configService.get('BOT_API_PORT', 4001);
    const publicPort = this.configService.get('BOT_PUBLIC_API_PORT', 4002);
    this.botUrls = {
      private:
        this.configService.get<string>('BOT_PRIVATE_BRIDGE_URL') ||
        `http://127.0.0.1:${privatePort}`,
      public:
        this.configService.get<string>('BOT_PUBLIC_BRIDGE_URL') ||
        `http://127.0.0.1:${publicPort}`,
    };
    this.secrets = {
      private: this.configService.get('BOT_API_SECRET', 'internal-bot-api-secret'),
      public: this.configService.get('BOT_PUBLIC_API_SECRET', 'internal-bot-public-api-secret'),
    };
  }

  private getHeaders(bot: BotType = 'private') {
    return {
      'Content-Type': 'application/json',
      'x-bot-secret': this.secrets[bot],
    };
  }

  private getUrl(bot: BotType = 'private') {
    return this.botUrls[bot];
  }

  // ── Status ──────────────────────────────────

  async getBotStatus(bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/status`, {
        headers: this.getHeaders(bot),
      });
      if (!response.ok) return { online: false, botType: bot };
      const data = (await response.json()) as Record<string, unknown>;
      return { ...data, botType: bot };
    } catch (error) {
      return { online: false, botType: bot };
    }
  }

  async getAllBotsStatus() {
    const [privateStatus, publicStatus] = await Promise.all([
      this.getBotStatus('private'),
      this.getBotStatus('public'),
    ]);
    return { private: privateStatus, public: publicStatus };
  }

  async getManagedGuilds(bot: BotType = 'private'): Promise<BridgeGuildSummary[]> {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds`, {
        headers: this.getHeaders(bot),
      });
      if (!response.ok) return [];
      return (await response.json()) as BridgeGuildSummary[];
    } catch (error: any) {
      this.logger.error(`Failed to get guild list (${bot}): ${error.message}`);
      return [];
    }
  }

  // ── Guild Info ──────────────────────────────

  async getGuildChannels(guildId: string, bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/channels`, {
        headers: this.getHeaders(bot),
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to get guild channels (${bot}): ${error.message}`);
      return [];
    }
  }

  async getGuildRoles(guildId: string, bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/roles`, {
        headers: this.getHeaders(bot),
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to get guild roles (${bot}): ${error.message}`);
      return [];
    }
  }

  // ── Ticket Panels ───────────────────────────

  async sendTicketPanel(guildId: string, channelId: string, embed: any, buttons: any[], bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/tickets/send-panel`, {
        method: 'POST',
        headers: this.getHeaders(bot),
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to send panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to send ticket panel (${bot}): ${error.message}`);
      throw error;
    }
  }

  async editTicketPanel(guildId: string, channelId: string, messageId: string, embed: any, buttons: any[], bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/tickets/panels/${messageId}`, {
        method: 'PATCH',
        headers: this.getHeaders(bot),
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to edit panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to edit ticket panel (${bot}): ${error.message}`);
      throw error;
    }
  }

  // ── Reaction Panels ─────────────────────────

  async sendReactionPanel(guildId: string, channelId: string, embed: any, buttons: any[], bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/reaction-roles/panels`, {
        method: 'POST',
        headers: this.getHeaders(bot),
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to send reaction panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to send reaction panel (${bot}): ${error.message}`);
      throw error;
    }
  }

  async editReactionPanel(guildId: string, channelId: string, messageId: string, embed: any, buttons: any[], bot: BotType = 'private') {
    try {
      const response = await fetch(`${this.getUrl(bot)}/guilds/${guildId}/reaction-roles/panels/${messageId}`, {
        method: 'PATCH',
        headers: this.getHeaders(bot),
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to edit reaction panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to edit reaction panel (${bot}): ${error.message}`);
      throw error;
    }
  }
}
