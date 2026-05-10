import { Controller, Get, Patch, Post, Param, Body, Delete, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfigManagerService } from './config.service';
import { BotService } from '../bot/bot.service';

@ApiTags('config')
@ApiBearerAuth()
@Controller('guilds/:guildId/config')
export class ConfigManagerController {
  constructor(
    private configService: ConfigManagerService,
    private botService: BotService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Pobierz konfigurację serwera' })
  async getConfig(@Param('guildId') guildId: string) {
    const config = await this.configService.getGuildConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch()
  @ApiOperation({ summary: 'Zaktualizuj konfigurację serwera' })
  async updateConfig(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateGuildConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('welcome')
  @ApiOperation({ summary: 'Pobierz konfigurację powitań' })
  async getWelcome(@Param('guildId') guildId: string) {
    const config = await this.configService.getWelcomeConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch('welcome')
  @ApiOperation({ summary: 'Zaktualizuj konfigurację powitań' })
  async updateWelcome(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateWelcomeConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('economy')
  @ApiOperation({ summary: 'Pobierz konfigurację ekonomii' })
  async getEconomy(@Param('guildId') guildId: string) {
    const config = await this.configService.getEconomyConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch('economy')
  @ApiOperation({ summary: 'Zaktualizuj konfigurację ekonomii' })
  async updateEconomy(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateEconomyConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('levels')
  @ApiOperation({ summary: 'Pobierz konfigurację poziomów' })
  async getLevels(@Param('guildId') guildId: string) {
    const config = await this.configService.getLevelConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch('levels')
  @ApiOperation({ summary: 'Zaktualizuj konfigurację poziomów' })
  async updateLevels(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateLevelConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('tickets')
  @ApiOperation({ summary: 'Pobierz konfigurację ticketów' })
  async getTickets(@Param('guildId') guildId: string) {
    const config = await this.configService.getTicketConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch('tickets')
  @ApiOperation({ summary: 'Zaktualizuj konfigurację ticketów' })
  async updateTickets(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateTicketConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('automod')
  @ApiOperation({ summary: 'Pobierz reguły automod' })
  async getAutoMod(@Param('guildId') guildId: string) {
    const rules = await this.configService.getAutoModRules(guildId);
    return { success: true, data: rules, timestamp: new Date().toISOString() };
  }

  @Post('automod')
  @ApiOperation({ summary: 'Dodaj regułę automod' })
  async createAutoModRule(@Param('guildId') guildId: string, @Body() data: any) {
    const rule = await this.configService.createAutoModRule(guildId, data);
    return { success: true, data: rule, timestamp: new Date().toISOString() };
  }

  @Patch('automod/:ruleId')
  @ApiOperation({ summary: 'Zaktualizuj regułę automod' })
  async updateAutoModRule(@Param('ruleId') ruleId: string, @Body() data: any) {
    const rule = await this.configService.updateAutoModRule(ruleId, data);
    return { success: true, data: rule, timestamp: new Date().toISOString() };
  }

  @Delete('automod/:ruleId')
  @ApiOperation({ summary: 'Usuń regułę automod' })
  async deleteAutoModRule(@Param('ruleId') ruleId: string) {
    await this.configService.deleteAutoModRule(ruleId);
    return { success: true };
  }

  @Get('moderation')
  @ApiOperation({ summary: 'Pobierz konfigurację moderacji' })
  async getModeration(@Param('guildId') guildId: string) {
    const config = await this.configService.getModerationConfig(guildId);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Patch('moderation')
  @ApiOperation({ summary: 'Zaktualizuj konfigurację moderacji' })
  async updateModeration(@Param('guildId') guildId: string, @Body() data: any) {
    const config = await this.configService.updateModerationConfig(guildId, data);
    return { success: true, data: config, timestamp: new Date().toISOString() };
  }

  @Get('reaction-roles')
  @ApiOperation({ summary: 'Pobierz panele reaction roles' })
  async getReactionPanels(@Param('guildId') guildId: string) {
    const panels = await this.configService.getReactionPanels(guildId);
    return { success: true, data: panels };
  }

  @Post('reaction-roles')
  @ApiOperation({ summary: 'Utwórz panel reaction roles' })
  async createReactionPanel(@Param('guildId') guildId: string, @Body() data: any) {
    const panel = await this.configService.createReactionPanel(guildId, data);
    return { success: true, data: panel };
  }

  @Patch('reaction-roles/:panelId')
  @ApiOperation({ summary: 'Zaktualizuj panel reaction roles' })
  async updateReactionPanel(@Param('panelId') panelId: string, @Body() data: any) {
    const panel = await this.configService.updateReactionPanel(panelId, data);
    return { success: true, data: panel };
  }

  @Delete('reaction-roles/:panelId')
  @ApiOperation({ summary: 'Usuń panel reaction roles' })
  async deleteReactionPanel(@Param('panelId') panelId: string) {
    await this.configService.deleteReactionPanel(panelId);
    return { success: true };
  }

  @Post('reaction-roles/:panelId/deploy')
  @ApiOperation({ summary: 'Wyślij lub zaktualizuj panel na Discordzie' })
  async deployReactionPanel(
    @Param('guildId') guildId: string,
    @Param('panelId') panelId: string
  ) {
    const [guild, panel] = await Promise.all([
      this.configService.getGuildById(guildId),
      this.configService.getReactionPanel(panelId)
    ]);

    if (!guild) {
      console.error(`[DEPLOY] Guild not found in DB for ID: ${guildId}`);
      throw new NotFoundException('Guild not found');
    }
    
    console.log(`[DEPLOY] Translating DB ID ${guildId} to Discord ID ${guild.discordId}`);
    
    if (!panel || !panel.channelId) throw new NotFoundException('Wybierz kanał przed wysłaniem panelu!');
    if (!panel.buttons || panel.buttons.length === 0) throw new NotFoundException('Dodaj przynajmniej jeden przycisk!');
    
    // Sprawdź czy każdy przycisk ma rolę
    const missingRole = panel.buttons.find(b => !b.roleId);
    if (missingRole) throw new NotFoundException(`Przycisk "${missingRole.label}" nie ma przypisanej roli!`);

    const embed = {
      title: panel.title,
      description: panel.description,
      color: panel.color,
      footer: panel.footer,
      thumbnail: panel.thumbnail,
      image: panel.image,
    };

    let result: any;
    if (panel.messageId) {
      try {
        result = await this.botService.editReactionPanel(
          guild.discordId,
          panel.channelId,
          panel.messageId,
          embed,
          panel.buttons
        );
      } catch (err) {
        result = await this.botService.sendReactionPanel(
          guild.discordId,
          panel.channelId,
          embed,
          panel.buttons
        );
      }
    } else {
      result = await this.botService.sendReactionPanel(
        guild.discordId,
        panel.channelId,
        embed,
        panel.buttons
      );
    }

    if (result.messageId && result.messageId !== panel.messageId) {
      await this.configService.updateReactionPanel(panelId, {
        messageId: result.messageId,
      });
    }

    return { success: true, messageId: result.messageId };
  }
}
