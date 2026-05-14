import { Message, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import type { BotClient } from '../client';
import { logger } from '../utils/logger';

// Prosty cache dla anty-spamu
const spamCache = new Map<string, { count: number, lastTime: number }>();

export async function handleAutoMod(client: BotClient, message: Message) {
  if (message.author.bot || !message.guild || !message.member) return;

  // 1. Sprawdź czy AutoMod jest włączony dla serwera
  const guild = await client.prisma.guild.findUnique({
    where: { discordId: message.guild.id },
    include: { config: true }
  });

  if (!guild) {
    logger.warn(`AutoMod: Nie znaleziono guildu w bazie: ${message.guild.id}`);
    return;
  }

  if (!guild.config?.automodEnabled) {
    logger.info(`AutoMod: Moduł wyłączony dla ${message.guild.name}`);
    return;
  }

  // 2. Pobierz reguły dla serwera
  const rules = await client.prisma.autoModRule.findMany({
    where: { guildId: guild.id, enabled: true },
  });

  logger.info(`AutoMod: Znaleziono ${rules.length} aktywnych reguł dla ${message.guild.name}`);

  if (rules.length === 0) return;

  // 3. Sprawdź każdą regułę
  for (const rule of rules) {
    logger.info(`AutoMod: [${rule.type}] Sprawdzanie wiadomości: "${message.content}"`);
    logger.info(`AutoMod: [${rule.type}] Zakazane słowa: [${rule.words.join(', ')}]`);
    
    // Sprawdź kanały docelowe
    if (rule.targetChannels.length > 0 && !rule.targetChannels.includes(message.channel.id)) {
       logger.info(`AutoMod: Kanał nie jest objęty ochroną tej reguły.`);
       continue;
    }

    // Sprawdź whitelistę (role i kanały)
    if (rule.exemptRoles.some(id => message.member?.roles.cache.has(id))) {
       logger.info(`AutoMod: Użytkownik ma pominiętą rolę.`);
       continue;
    }
    if (rule.exemptChannels.includes(message.channel.id)) {
       logger.info(`AutoMod: Kanał jest na białej liście.`);
       continue;
    }
    // Tymczasowo wyłączone, abyś mógł przetestować na sobie:
    // if (message.member.permissions.has(PermissionFlagsBits.ManageMessages)) continue;

    let triggered = false;
    let reason = '';

    switch (rule.type) {
      case 'WORD_FILTER':
        const found = rule.words.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
        if (found) {
          triggered = true;
          reason = 'Użycie zakazanego słowa';
          logger.info(`AutoMod: Wykryto zakazane słowo!`);
        }
        break;

      case 'LINK_FILTER':
        if (/(https?:\/\/[^\s]+)/g.test(message.content)) {
          triggered = true;
          reason = 'Wysłanie linku';
        }
        break;

      case 'INVITE_FILTER':
        if (/(discord\.gg\/|discord\.com\/invite\/)/g.test(message.content)) {
          triggered = true;
          reason = 'Wysłanie zaproszenia Discord';
        }
        break;

      case 'CAPS_FILTER':
        const capsCount = (message.content.match(/[A-Z]/g) || []).length;
        if (message.content.length > 10 && (capsCount / message.content.length) > (rule.threshold / 100)) {
          triggered = true;
          reason = 'Nadużywanie wielkich liter (Caps-Lock)';
        }
        break;

      case 'SPAM_FILTER':
        const key = `${message.guild.id}:${message.author.id}`;
        const now = Date.now();
        const data = spamCache.get(key) || { count: 0, lastTime: now };

        if (now - data.lastTime < 5000) { // Okno 5 sekund
          data.count++;
        } else {
          data.count = 1;
          data.lastTime = now;
        }
        spamCache.set(key, data);

        if (data.count > rule.threshold) {
          triggered = true;
          reason = 'Spamowanie wiadomościami';
          spamCache.delete(key);
        }
        break;
    }

    if (triggered) {
      return executeAction(client, message, rule, reason);
    }
  }
}

async function executeAction(client: BotClient, message: Message, rule: any, reason: string) {
  try {
    // 1. Wyślij log jeśli ustawiono
    if (rule.alertChannelId) {
      const alertChannel = message.guild?.channels.cache.get(rule.alertChannelId);
      if (alertChannel?.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🛡️ Interwencja AutoMod')
          .setColor('#f59e0b')
          .addFields(
            { name: 'Użytkownik', value: `${message.author.tag} (${message.author.id})`, inline: true },
            { name: 'Zasada', value: rule.type, inline: true },
            { name: 'Powód', value: reason, inline: true },
            { name: 'Treść', value: message.content.slice(0, 1024) }
          )
          .setTimestamp();
        await (alertChannel as any).send({ embeds: [logEmbed] });
      }
    }

    // 2. Wyślij odpowiedź do użytkownika
    if (rule.customResponse) {
      await (message.channel as any).send(`${message.author}, ${rule.customResponse}`).then((msg: Message) => {
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      });
    }

    // 3. Wykonaj akcję
    switch (rule.action) {
      case 'DELETE':
        await message.delete().catch(() => {});
        break;

      case 'WARN':
        await message.delete().catch(() => {});
        // Tutaj można dodać logikę warnów (zapis do bazy)
        await client.prisma.warning.create({
          data: {
            guildId: message.guild!.id,
            userId: message.author.id,
            moderatorId: client.user!.id,
            reason: `[AutoMod] ${reason}`,
          }
        });
        break;

      case 'MUTE':
        await message.delete().catch(() => {});
        if (message.member?.moderatable) {
           await message.member.timeout(rule.duration ? rule.duration * 1000 : 3600000, `[AutoMod] ${reason}`);
        }
        break;

      case 'KICK':
        if (message.member?.kickable) {
           await message.member.kick(`[AutoMod] ${reason}`);
        }
        break;
    }

    logger.info(`AutoMod interwencja: ${message.author.tag} na ${message.guild?.name} (${reason})`);
  } catch (error) {
    logger.error(`Błąd podczas egzekucji AutoMod: ${error}`);
  }
}
