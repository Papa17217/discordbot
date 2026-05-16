import { ModalSubmitInteraction } from 'discord.js';
import type { BotClient } from '../client';
import { Embed } from '../structures/Embed';
import { logger } from '../utils/logger';

export async function handleGodzinkiModal(client: BotClient, interaction: ModalSubmitInteraction) {
  try {
    if (!interaction.guildId) return;

    const name = interaction.fields.getTextInputValue('godzinki_name');
    const badgeStr = interaction.fields.getTextInputValue('godzinki_badge');
    const badges = badgeStr.split(/[, ]+/).map(b => b.trim()).filter(b => b.length > 0);
    const type = interaction.fields.getTextInputValue('godzinki_type').toLowerCase();
    const timeStr = interaction.fields.getTextInputValue('godzinki_time').toLowerCase();

    // Proste parsowanie czasu, np. "2h 30m", "1.5h", "45m"
    let hours = 0;
    let minutes = 0;

    const hMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/);
    if (hMatch) {
      const parsedH = parseFloat(hMatch[1]);
      hours += Math.floor(parsedH);
      minutes += Math.round((parsedH - Math.floor(parsedH)) * 60);
    }

    const mMatch = timeStr.match(/(\d+)\s*m/);
    if (mMatch) {
      minutes += parseInt(mMatch[1], 10);
    }

    // Fallback jeśli ktoś wpisze po prostu liczbę "2" jako godziny
    if (!hMatch && !mMatch) {
      const parsedH = parseFloat(timeStr);
      if (!isNaN(parsedH)) {
        hours += Math.floor(parsedH);
        minutes += Math.round((parsedH - Math.floor(parsedH)) * 60);
      }
    }

    // Normalizacja minut do godzin
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;

    const guild = await client.prisma.guild.findUnique({
      where: { discordId_botType: { discordId: interaction.guildId, botType: 'PRIVATE' } },
    });

    if (!guild) {
      await interaction.reply({ content: 'Serwer nie jest skonfigurowany w bazie.', ephemeral: true });
      return;
    }

    let dbUser = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!dbUser) {
      dbUser = await client.prisma.user.create({
        data: { discordId: interaction.user.id, username: interaction.user.username },
      });
    }

    if (badges.length === 0) {
      await interaction.reply({ content: 'Musisz podać co najmniej jedną odznakę.', ephemeral: true });
      return;
    }

    const insertData = badges.map(b => ({
      guildId: guild.id,
      userId: dbUser.id,
      name,
      badge: b,
      type,
      hours,
      minutes,
    }));

    await client.prisma.dutyLog.createMany({
      data: insertData,
    });

    await interaction.reply({
      embeds: [
        Embed.success('Zapisano raport', `Pomyślnie dodano szkolenie **${type}** dla **${badges.length}** osób (Odznaki: ${badges.join(', ')}) (${hours}h ${minutes}m).`)
      ],
      ephemeral: true,
    });
  } catch (error) {
    logger.error('Błąd w formularzu godzinki:', error);
    await interaction.reply({ content: 'Wystąpił błąd podczas zapisywania raportu.', ephemeral: true });
  }
}
