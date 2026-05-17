import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  GuildMember,
} from 'discord.js';
import { Command } from '../../structures/Command';
import { Embed } from '../../structures/Embed';
import type { BotClient } from '../../client';

export default class GodzinkiCommand extends Command {
  constructor() {
    super({
      data: new SlashCommandBuilder()
        .setName('godzinki')
        .setDescription('System logowania szkoleń i czasu służby')
        .addSubcommand((sub) =>
          sub
            .setName('dodaj')
            .setDescription('Wypełnij raport szkolenia za pomocą formularza')
        )
        .addSubcommand((sub) =>
          sub
            .setName('statystyki')
            .setDescription('Sprawdź statystyki po numerze odznaki')
            .addStringOption((opt) => opt.setName('odznaka').setDescription('Numer odznaki postaci').setRequired(true))
        )
        .addSubcommand((sub) =>
          sub
            .setName('wyczysc')
            .setDescription('Wyczyść wszystkie logi godzin i szkoleń (tylko dla zarządu)')
        ),
      cooldown: 5,
      module: 'utility',
    });
  }

  async execute(interaction: ChatInputCommandInteraction, client: BotClient) {
    if (!interaction.guildId) return;
    const subcommand = interaction.options.getSubcommand();

    const guild = await client.prisma.guild.findUnique({
      where: { discordId_botType: { discordId: interaction.guildId, botType: 'PRIVATE' } },
    });
    if (!guild) {
      await interaction.reply({ content: 'Serwer nie jest skonfigurowany w bazie.', ephemeral: true });
      return;
    }

    // Znajdź lub utwórz usera wykonującego
    let dbUser = await client.prisma.user.findUnique({ where: { discordId: interaction.user.id } });
    if (!dbUser) {
      dbUser = await client.prisma.user.create({
        data: { discordId: interaction.user.id, username: interaction.user.username },
      });
    }

    if (subcommand === 'dodaj') {
      const modal = new ModalBuilder()
        .setCustomId('godzinki_modal')
        .setTitle('Raport ze szkolenia');

      const nameInput = new TextInputBuilder()
        .setCustomId('godzinki_name')
        .setLabel('Imię i nazwisko')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const badgeInput = new TextInputBuilder()
        .setCustomId('godzinki_badge')
        .setLabel('Nr odznaki (można po przecinku, np. 12, 15)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const typeInput = new TextInputBuilder()
        .setCustomId('godzinki_type')
        .setLabel('Rodzaj (nego, sv, rto, pwc, ocean...)')
        .setPlaceholder('np. doszkalanie, godziny z cadetem, merry...')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const timeInput = new TextInputBuilder()
        .setCustomId('godzinki_time')
        .setLabel('Czas (wpisz dokładnie, np 2h 30m)')
        .setPlaceholder('np. 2h 30m, 1h 45m, 3h')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const examinedBadgeInput = new TextInputBuilder()
        .setCustomId('godzinki_examined_badge')
        .setLabel('Nr odznaki egzaminowanego (opcjonalnie)')
        .setPlaceholder('np. 12 (jeśli to było szkolenie)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(badgeInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(typeInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(timeInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(examinedBadgeInput)
      );

      await interaction.showModal(modal);
      return;
    }

    const allowedRoles = ['1498303677583327472', '1498308470351331438', '1498303677583327471'];
    const allowedUser = '686341030240321566';
    const hasPermission = (interaction.member && (interaction.member as GuildMember).roles.cache.some(role => allowedRoles.includes(role.id))) || interaction.user.id === allowedUser;

    if (subcommand === 'statystyki') {
      if (!hasPermission) {
        await interaction.reply({ content: 'Nie masz uprawnień do sprawdzania statystyk.', ephemeral: true });
        return;
      }

      const badge = interaction.options.getString('odznaka', true).trim();

      const logs = await client.prisma.dutyLog.findMany({
        where: { guildId: guild.id, badge: { contains: badge } },
      });

      // Filtrujemy dokładniej dla numeru odznaki (ponieważ np odznaka 1 mogłaby zwrócić "12")
      const exactLogs = logs.filter(log => {
        const badges = log.badge.split(/[, ]+/).map(b => b.trim());
        return badges.includes(badge);
      });

      if (exactLogs.length === 0) {
        await interaction.reply({ embeds: [Embed.warning('Brak Danych', `Brak zarejestrowanych szkoleń dla odznaki **${badge}**.`)] });
        return;
      }

      const typeCounts: Record<string, number> = {};
      let totalMinutes = 0;
      let employeeName = exactLogs[0].name;

      for (const log of exactLogs) {
        let typeStr = log.type;
        if (log.examinedBadge) {
          typeStr += ` (Odznaka: ${log.examinedBadge})`;
        }
        typeCounts[typeStr] = (typeCounts[typeStr] || 0) + 1;
        totalMinutes += (log.hours * 60) + log.minutes;
      }

      const sumHours = Math.floor(totalMinutes / 60);
      const sumMins = totalMinutes % 60;

      const fields = Object.entries(typeCounts).map(([type, count]) => {
        // Capitalize first letter of type
        const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
        return { name: formattedType, value: `${count} razy`, inline: true };
      });

      const embed = Embed.info(`Statystyki: Odznaka ${badge}`)
        .setDescription(`**Imię i nazwisko (z ostatniego wpisu):** ${employeeName}\n\nŁączny czas: **${sumHours} godzin, ${sumMins} minut**\nŁącznie odbytych szkoleń: **${exactLogs.length}**`)
        .addFields(fields);

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (subcommand === 'wyczysc') {
      if (!hasPermission) {
        await interaction.reply({ content: 'Nie masz uprawnień do użycia tej komendy.', ephemeral: true });
        return;
      }

      await client.prisma.dutyLog.deleteMany({
        where: { guildId: guild.id },
      });

      await interaction.reply({
        embeds: [Embed.success('Wyczyszczono', 'Wszystkie godziny i raporty ze szkoleń zostały wyczyszczone pomyślnie.')]
      });
      return;
    }
  }
}
