// ============================================
// Cooldown Manager — Redis-backed
// ============================================

import { redis } from './redis';

export async function checkCooldown(
  userId: string,
  commandName: string,
  cooldownSeconds: number,
): Promise<{ onCooldown: boolean; remaining: number }> {
  const key = `cooldown:${commandName}:${userId}`;

  try {
    const ttl = await redis.ttl(key);

    if (ttl > 0) {
      return { onCooldown: true, remaining: ttl };
    }

    await redis.setex(key, cooldownSeconds, '1');
    return { onCooldown: false, remaining: 0 };
  } catch {
    // Jeśli Redis nie działa, pozwól na komendę
    return { onCooldown: false, remaining: 0 };
  }
}
