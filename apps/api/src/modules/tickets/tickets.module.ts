import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { PanelsService } from './panels.service';
import { PanelsController } from './panels.controller';

@Module({
  controllers: [PanelsController, TicketsController],
  providers: [TicketsService, PanelsService],
  exports: [TicketsService, PanelsService],
})
export class TicketsModule {}
