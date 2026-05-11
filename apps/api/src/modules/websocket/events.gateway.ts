// ============================================
// WebSocket Gateway — Real-time Events
// ============================================

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})

export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ── Połączenie — weryfikacja JWT ───────────

  async handleConnection(client: Socket) {
    console.log(`📡 Próba połączenia WebSocket: ${client.id}`);
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        console.warn(`⚠️ Brak tokena dla połączenia ${client.id}`);
        // client.disconnect(); // Tymczasowo wyłączone dla testu
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      this.connectedUsers.set(client.id, payload.sub);
      console.log(`🔌 WebSocket: ${payload.username} połączony (${client.id})`);
    } catch (err: any) {
      console.error(`❌ Błąd autoryzacji WebSocket dla ${client.id}:`, err?.message || 'Nieznany błąd');
      // client.disconnect(); // Tymczasowo wyłączone dla testu
    }
  }



  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    if (userId) {
      console.log(`🔌 WebSocket: rozłączono (${client.id})`);
    }
  }

  // ── Subskrypcja do pokoju serwera ──────────

  @SubscribeMessage('guild:join')
  handleJoinGuild(@ConnectedSocket() client: Socket, @MessageBody() guildId: string) {
    client.join(`guild:${guildId}`);
    console.log(`📡 ${client.id} dołączył do pokoju guild:${guildId}`);
  }

  @SubscribeMessage('guild:leave')
  handleLeaveGuild(@ConnectedSocket() client: Socket, @MessageBody() guildId: string) {
    client.leave(`guild:${guildId}`);
  }

  @SubscribeMessage('admin:join')
  async handleJoinAdmin(@ConnectedSocket() client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    // Można dodać sprawdzanie roli w bazie tutaj, dla bezpieczeństwa
    client.join('admin:logs');
    console.log(`🛡️ Admin ${client.id} dołączył do konsoli logów`);
  }

  @SubscribeMessage('admin:leave')
  handleLeaveAdmin(@ConnectedSocket() client: Socket) {
    client.leave('admin:logs');
  }

  // ── Emit Events (wywoływane z serwisów) ────

  emitLog(data: { level: string; message: string; timestamp: string }) {
    this.server.to('admin:logs').emit('admin:log', data);
  }

  emitToGuild(guildId: string, event: string, data: any) {
    this.server.to(`guild:${guildId}`).emit(event, data);
  }

  emitToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  emitBotStatus(data: { online: boolean; uptime: number; guilds: number; ping: number }) {
    this.server.emit('bot:status', data);
  }

  emitModerationAction(guildId: string, data: any) {
    this.emitToGuild(guildId, 'moderation:action', data);
  }

  emitAnalyticsUpdate(guildId: string, data: any) {
    this.emitToGuild(guildId, 'analytics:update', data);
  }

  emitGuildStatsUpdate(guildId: string, data: any) {
    this.emitToGuild(guildId, 'guild:stats:update', data);
  }

  getConnectedCount(): number {
    return this.connectedUsers.size;
  }
}
