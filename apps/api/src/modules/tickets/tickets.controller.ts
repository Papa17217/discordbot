import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('guilds/:guildId/tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  @ApiOperation({ summary: 'Pobierz tickety serwera' })
  async getTickets(@Param('guildId') guildId: string, @Query('status') status?: string) {
    const data = await this.ticketsService.getTickets(guildId, status);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get(':ticketId')
  @ApiOperation({ summary: 'Pobierz szczegóły ticketu' })
  async getTicket(@Param('ticketId') ticketId: string) {
    const data = await this.ticketsService.getTicket(ticketId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':ticketId/close')
  @ApiOperation({ summary: 'Zamknij ticket' })
  async closeTicket(@Param('ticketId') ticketId: string) {
    const data = await this.ticketsService.closeTicket(ticketId);
    return { success: true, data, timestamp: new Date().toISOString() };
  }
}
