import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { EconomyService } from './economy.service';

@ApiTags('economy')
@ApiBearerAuth()
@Controller('guilds/:guildId/economy')
export class EconomyController {
  constructor(private economyService: EconomyService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Ranking ekonomii' })
  async getLeaderboard(@Param('guildId') guildId: string, @Query('limit') limit = 10) {
    const data = await this.economyService.getLeaderboard(guildId, limit);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('transactions')
  @ApiOperation({ summary: 'Historia transakcji' })
  async getTransactions(@Param('guildId') guildId: string, @Query('page') page = 1) {
    const result = await this.economyService.getTransactions(guildId, page);
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get('shop')
  @ApiOperation({ summary: 'Przedmioty w sklepie' })
  async getShop(@Param('guildId') guildId: string) {
    const data = await this.economyService.getShopItems(guildId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Post('shop')
  @ApiOperation({ summary: 'Dodaj przedmiot do sklepu' })
  async createShopItem(@Param('guildId') guildId: string, @Body() data: any) {
    const item = await this.economyService.createShopItem(guildId, data);
    return { success: true, data: item, timestamp: new Date().toISOString() };
  }

  @Patch('shop/:itemId')
  @ApiOperation({ summary: 'Edytuj przedmiot w sklepie' })
  async updateShopItem(@Param('itemId') itemId: string, @Body() data: any) {
    const item = await this.economyService.updateShopItem(itemId, data);
    return { success: true, data: item, timestamp: new Date().toISOString() };
  }

  @Delete('shop/:itemId')
  @ApiOperation({ summary: 'Usuń przedmiot ze sklepu' })
  async deleteShopItem(@Param('itemId') itemId: string) {
    await this.economyService.deleteShopItem(itemId);
    return { success: true, message: 'Usunięto', timestamp: new Date().toISOString() };
  }
}
