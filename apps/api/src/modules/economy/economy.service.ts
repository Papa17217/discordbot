import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EconomyService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(guildId: string, limit = 10) {
    return this.prisma.guildMember.findMany({
      where: { guildId },
      orderBy: { balance: 'desc' },
      take: limit,
      include: {
        user: { select: { username: true, avatar: true, discordId: true } },
      },
    });
  }

  async getTransactions(guildId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where: { guildId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { username: true } } },
      }),
      this.prisma.transaction.count({ where: { guildId } }),
    ]);
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 },
    };
  }

  async getShopItems(guildId: string) {
    return this.prisma.shopItem.findMany({
      where: { guildId },
      orderBy: { price: 'asc' },
    });
  }

  async createShopItem(guildId: string, data: { name: string; description?: string; price: number; roleId?: string; stock?: number }) {
    return this.prisma.shopItem.create({
      data: { guildId, ...data },
    });
  }

  async updateShopItem(itemId: string, data: any) {
    return this.prisma.shopItem.update({ where: { id: itemId }, data });
  }

  async deleteShopItem(itemId: string) {
    return this.prisma.shopItem.delete({ where: { id: itemId } });
  }
}
