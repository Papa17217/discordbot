import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('guilds/:guildId/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Przegląd analityki serwera' })
  async getOverview(@Param('guildId') guildId: string) {
    const data = await this.analyticsService.getOverview(guildId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('commands')
  @ApiOperation({ summary: 'Statystyki użycia komend' })
  async getCommandStats(@Param('guildId') guildId: string, @Query('days') days = 7) {
    const data = await this.analyticsService.getCommandStats(guildId, days);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('members')
  @ApiOperation({ summary: 'Wzrost członków' })
  async getMemberGrowth(@Param('guildId') guildId: string, @Query('days') days = 30) {
    const data = await this.analyticsService.getMemberGrowth(guildId, days);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
