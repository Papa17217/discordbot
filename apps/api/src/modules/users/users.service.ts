import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findById(id: string) {
    const cached = await this.redis.getJson(`user:profile:${id}`);
    if (cached) return cached;

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        discordId: true,
        username: true,
        discriminator: true,
        avatar: true,
        email: true,
        role: true,
        subscription: true,
        createdAt: true,
      },
    });

    if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

    await this.redis.setJson(`user:profile:${id}`, user, 120);
    return user;
  }

  async findByDiscordId(discordId: string) {
    return this.prisma.user.findUnique({
      where: { discordId },
    });
  }

  async getUserGuilds(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('Użytkownik nie znaleziony');

    return this.prisma.guild.findMany({
      where: { ownerId: user.discordId },
      include: { config: true },
      orderBy: { name: 'asc' },
    });
  }

  async updateRole(userId: string, role: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });
    await this.redis.del(`user:profile:${userId}`);
    await this.redis.del(`user:${userId}`);
    return user;
  }
}
