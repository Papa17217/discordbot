import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { BotModule } from '../bot/bot.module';

@Module({
  imports: [BotModule],
  controllers: [AdminController],
})
export class AdminModule {}
