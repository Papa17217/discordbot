import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BotService {
  private readonly botUrl: string;
  private readonly secret: string;
  private readonly logger = new Logger(BotService.name);

  constructor(private configService: ConfigService) {
    this.botUrl = `http://localhost:${this.configService.get('BOT_API_PORT', 4001)}`;
    this.secret = this.configService.get('BOT_API_SECRET', 'internal-bot-api-secret');
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      'x-bot-secret': this.secret,
    };
  }

  async getBotStatus() {
    try {
      const response = await fetch(`${this.botUrl}/status`, {
        headers: this.headers,
      });
      if (!response.ok) return { online: false };
      return response.json();
    } catch (error) {
      return { online: false };
    }
  }

  async getGuildChannels(guildId: string) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/channels`, {
        headers: this.headers,
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to get guild channels: ${error.message}`);
      return [];
    }
  }

  async getGuildRoles(guildId: string) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/roles`, {
        headers: this.headers,
      });
      if (!response.ok) return [];
      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to get guild roles: ${error.message}`);
      return [];
    }
  }

  async sendTicketPanel(guildId: string, channelId: string, embed: any, buttons: any[]) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/tickets/send-panel`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to send panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to send ticket panel: ${error.message}`);
      throw error;
    }
  }
  async editTicketPanel(guildId: string, channelId: string, messageId: string, embed: any, buttons: any[]) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/tickets/panels/${messageId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to edit panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to edit ticket panel: ${error.message}`);
      throw error;
    }
  }

  async sendReactionPanel(guildId: string, channelId: string, embed: any, buttons: any[]) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/reaction-roles/send-panel`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to send reaction panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to send reaction panel: ${error.message}`);
      throw error;
    }
  }

  async editReactionPanel(guildId: string, channelId: string, messageId: string, embed: any, buttons: any[]) {
    try {
      const response = await fetch(`${this.botUrl}/guilds/${guildId}/reaction-roles/panels/${messageId}`, {
        method: 'PATCH',
        headers: this.headers,
        body: JSON.stringify({ channelId, embed, buttons }),
      });

      if (!response.ok) {
        const err: any = await response.json();
        throw new Error(err.error || 'Failed to edit reaction panel');
      }

      return response.json();
    } catch (error: any) {
      this.logger.error(`Failed to edit reaction panel: ${error.message}`);
      throw error;
    }
  }
}
