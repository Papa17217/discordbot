import { Controller, Get, Param, Headers } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { GuildsService } from './guilds.service';
import { CurrentUser } from '../../common/decorators';
import { parseActiveBotHeader } from '../../common/utils/active-bot.util';

@ApiTags('guilds')
@ApiBearerAuth()
@Controller('guilds')
export class GuildsController {
  constructor(private guildsService: GuildsService) {}

  @Get()
  @ApiOperation({ summary: 'Pobierz serwery użytkownika' })
  async getUserGuilds(
    @CurrentUser('id') userId: string,
    @CurrentUser('discordId') discordId: string,
    @Headers('x-active-bot') activeBot?: string,
  ) {
    const guilds = await this.guildsService.getUserGuilds(
      userId,
      discordId,
      parseActiveBotHeader(activeBot),
    );
    return { success: true, data: guilds, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz szczegóły serwera' })
  async getGuild(
    @Param('id') id: string,
    @CurrentUser('discordId') discordId: string,
  ) {
    const guild = await this.guildsService.getGuild(id, discordId);
    return { success: true, data: guild, timestamp: new Date().toISOString() };
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Pobierz statystyki serwera' })
  async getGuildStats(@Param('id') id: string) {
    const stats = await this.guildsService.getGuildStats(id);
    return { success: true, data: stats, timestamp: new Date().toISOString() };
  }

  @Get(':id/channels')
  @ApiOperation({ summary: 'Pobierz kanały serwera' })
  async getChannels(@Param('id') id: string, @Headers('x-active-bot') activeBot?: string) {
    const channels = await this.guildsService.getChannels(id, parseActiveBotHeader(activeBot));
    return { success: true, data: channels };
  }

  @Get(':id/roles')
  @ApiOperation({ summary: 'Pobierz role serwera' })
  async getRoles(@Param('id') id: string, @Headers('x-active-bot') activeBot?: string) {
    const roles = await this.guildsService.getRoles(id, parseActiveBotHeader(activeBot));
    return { success: true, data: roles };
  }
}
