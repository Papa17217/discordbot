import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModerationService } from './moderation.service';

@ApiTags('moderation')
@ApiBearerAuth()
@Controller('guilds/:guildId/moderation')
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get('logs')
  @ApiOperation({ summary: 'Pobierz logi moderacji' })
  async getLogs(
    @Param('guildId') guildId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const result = await this.moderationService.getLogs(guildId, page, limit);
    return { success: true, ...result, timestamp: new Date().toISOString() };
  }

  @Get('warnings')
  @ApiOperation({ summary: 'Pobierz ostrzeżenia' })
  async getWarnings(
    @Param('guildId') guildId: string,
    @Query('userId') userId?: string,
  ) {
    const warnings = await this.moderationService.getWarnings(guildId, userId);
    return { success: true, data: warnings, timestamp: new Date().toISOString() };
  }

  @Delete('warnings/:userId')
  @ApiOperation({ summary: 'Wyczyść ostrzeżenia użytkownika' })
  async clearWarnings(
    @Param('guildId') guildId: string,
    @Param('userId') userId: string,
  ) {
    await this.moderationService.clearWarnings(guildId, userId);
    return { success: true, message: 'Ostrzeżenia wyczyszczone', timestamp: new Date().toISOString() };
  }
}
