import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async getTickets(guildId: string, status?: string) {
    return this.prisma.ticket.findMany({
      where: { 
        guildId, 
        ...(status && { status: status as any }) 
      },
      include: { 
        user: { select: { username: true, avatar: true, discordId: true } } 
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { 
        user: { select: { username: true, avatar: true, discordId: true } },
        transcript: true
      },
    });
    if (!ticket) throw new NotFoundException('Ticket nie znaleziony');
    return ticket;
  }


  async closeTicket(ticketId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED', closedAt: new Date() },
    });
  }
}
