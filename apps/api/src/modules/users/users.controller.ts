import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Pobierz swój profil' })
  async getMe(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    return { success: true, data: user, timestamp: new Date().toISOString() };
  }

  @Get('me/guilds')
  @ApiOperation({ summary: 'Pobierz swoje serwery' })
  async getMyGuilds(@CurrentUser('id') userId: string) {
    const guilds = await this.usersService.getUserGuilds(userId);
    return { success: true, data: guilds, timestamp: new Date().toISOString() };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Pobierz użytkownika po ID' })
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    return { success: true, data: user, timestamp: new Date().toISOString() };
  }
}
