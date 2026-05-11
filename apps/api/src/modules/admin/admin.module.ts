import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BotModule } from '../bot/bot.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [BotModule, WebSocketModule],
  controllers: [AdminController],
})

export class AdminModule {}
