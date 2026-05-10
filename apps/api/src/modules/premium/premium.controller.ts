import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PremiumService } from './premium.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('premium')
@ApiBearerAuth()
@Controller('premium')
export class PremiumController {
  constructor(private premiumService: PremiumService) {}

  @Get('subscriptions')
  @ApiOperation({ summary: 'Pobierz subskrypcje użytkownika' })
  async getSubscriptions(@CurrentUser('id') userId: string) {
    const data = await this.premiumService.getSubscriptions(userId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('features')
  @ApiOperation({ summary: 'Pobierz dostępne funkcje' })
  async getFeatures() {
    const data = await this.premiumService.getFeatureFlags();
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
