import { Controller, Get, Post, Patch, Delete, Param, Body, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PanelsService } from './panels.service';
import { parseActiveBotHeader } from '../../common/utils/active-bot.util';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('guilds/:guildId/tickets/panels')
export class PanelsController {
  constructor(private panelsService: PanelsService) {}

  @Get()
  @ApiOperation({ summary: 'Pobierz panele ticketowe serwera' })
  async getPanels(@Param('guildId') guildId: string) {
    const data = await this.panelsService.getPanels(guildId);
    return { success: true, data };
  }

  @Get(':panelId')
  @ApiOperation({ summary: 'Pobierz pojedynczy panel' })
  async getPanel(@Param('panelId') panelId: string) {
    const data = await this.panelsService.getPanel(panelId);
    return { success: true, data };
  }

  @Post()
  @ApiOperation({ summary: 'Utwórz nowy panel ticketowy' })
  async createPanel(
    @Param('guildId') guildId: string,
    @Body() body: any,
    @Headers('x-active-bot') activeBotHeader?: string,
  ) {
    const data = await this.panelsService.createPanel(guildId, body, parseActiveBotHeader(activeBotHeader));
    return { success: true, data };
  }

  @Patch(':panelId')
  @ApiOperation({ summary: 'Aktualizuj panel ticketowy' })
  async updatePanel(
    @Param('panelId') panelId: string,
    @Body() body: any,
    @Headers('x-active-bot') activeBotHeader?: string,
  ) {
    const data = await this.panelsService.updatePanel(panelId, body, parseActiveBotHeader(activeBotHeader));
    return { success: true, data };
  }

  @Delete(':panelId')
  @ApiOperation({ summary: 'Usuń panel ticketowy' })
  async deletePanel(@Param('panelId') panelId: string) {
    await this.panelsService.deletePanel(panelId);
    return { success: true };
  }
}
