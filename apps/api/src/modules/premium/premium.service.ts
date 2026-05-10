import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PremiumService {
  constructor(private prisma: PrismaService) {}

  async getSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      include: { guild: { select: { name: true, icon: true } } },
    });
  }

  async getFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async isFeatureEnabled(featureName: string, isPremium: boolean): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { name: featureName },
    });
    if (!flag) return false;
    if (!flag.enabled) return false;
    if (flag.premiumOnly && !isPremium) return false;
    return true;
  }

  async activatePremium(userId: string, guildId: string | null, tier: string) {
    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        guildId,
        tier: tier as any,
        active: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dni
      },
    });

    // Aktualizuj tier użytkownika
    await this.prisma.user.update({
      where: { id: userId },
      data: { subscription: tier as any },
    });

    // Jeśli guild, oznacz jako premium
    if (guildId) {
      await this.prisma.guild.update({
        where: { id: guildId },
        data: { premium: true, premiumTier: tier as any },
      });
    }

    return sub;
  }
}
