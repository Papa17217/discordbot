// ============================================
// Prisma Seed — Dane początkowe
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Rozpoczynam seedowanie bazy danych...');

  // ── Feature Flags ──────────────────────────
  const featureFlags = [
    { name: 'moderation', enabled: true, premiumOnly: false, description: 'System moderacji' },
    { name: 'economy', enabled: true, premiumOnly: false, description: 'System ekonomii' },
    { name: 'levels', enabled: true, premiumOnly: false, description: 'System poziomów XP' },
    { name: 'tickets', enabled: true, premiumOnly: false, description: 'System ticketów' },
    { name: 'welcome', enabled: true, premiumOnly: false, description: 'Wiadomości powitalne' },
    { name: 'automod', enabled: true, premiumOnly: false, description: 'Automatyczna moderacja' },
    { name: 'reaction_roles', enabled: true, premiumOnly: false, description: 'Role przez reakcje' },
    { name: 'giveaways', enabled: true, premiumOnly: false, description: 'System giveaway' },
    { name: 'verification', enabled: true, premiumOnly: false, description: 'Weryfikacja członków' },
    { name: 'temp_voice', enabled: true, premiumOnly: true, description: 'Tymczasowe kanały głosowe' },
    { name: 'ai_moderation', enabled: true, premiumOnly: true, description: 'Moderacja AI' },
    { name: 'ai_chat', enabled: true, premiumOnly: true, description: 'Chat AI' },
    { name: 'custom_embeds', enabled: true, premiumOnly: true, description: 'Kreator embedów' },
    { name: 'advanced_analytics', enabled: true, premiumOnly: true, description: 'Zaawansowana analityka' },
    { name: 'priority_support', enabled: true, premiumOnly: true, description: 'Priorytetowe wsparcie' },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: flag,
      create: flag,
    });
  }

  console.log(`✅ Utworzono ${featureFlags.length} flag funkcji`);
  console.log('🎉 Seedowanie zakończone!');
}

main()
  .catch((e) => {
    console.error('❌ Błąd seedowania:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
