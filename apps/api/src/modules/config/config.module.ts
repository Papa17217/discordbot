import { Module } from '@nestjs/common';
import { ConfigManagerService } from './config.service';
import { ConfigManagerController } from './config.controller';

@Module({
  controllers: [ConfigManagerController],
  providers: [ConfigManagerService],
  exports: [ConfigManagerService],
})
export class ConfigManagerModule {}
