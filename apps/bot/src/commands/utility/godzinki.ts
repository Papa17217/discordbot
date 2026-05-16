import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  PermissionFlagsBits,
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
            .setName('dodaj_formularz')
            .setDescription('Wypełnij raport szkolenia za pomocą wyskakującego formularza')
        )
        .addSubcommand((sub) =>
          sub
            .setName('dodaj_opcje')
            .setDescription('Wypełnij raport używając opcji komendy')
            .addStringOption((opt) => opt.setName('imie_nazwisko').setDescription('Imię i nazwisko postaci').setRequired(true))
            .addStringOption((opt) => opt.setName('odznaka').setDescription('Numer odznaki').setRequired(true))
            .addStringOption((opt) =>
              opt
                .setName('typ')
                .setDescription('Rodzaj szkolenia')
                .setRequired(true)
                .addChoices(
                  { name: 'Negocjacje (nego)', value: 'nego' },
                  { name: 'Supervisory (sv)', value: 'sv' },
                  { name: 'Merytoryka (mery)', value: 'mery' },
                  { name: 'Merytoryka Oficerska (meryof)', value: 'meryof' },
                  { name: 'Medyczne (med)', value: 'med' }
                )
            )
            .addIntegerOption((opt) => opt.setName('godziny').setDescription('Ilość godzin').setRequired(true).setMinValue(0))
            .addIntegerOption((opt) => opt.setName('minuty').setDescription('Ilość minut').setRequired(true).setMinValue(0).setMaxValue(59))
        )
        .addSubcommand((sub) =>
          sub
            .setName('statystyki')
            .setDescription('Sprawdź statystyki swoje lub innej osoby')
            .addUserOption((opt) => opt.setName('osoba').setDescription('Osoba do sprawdzenia (zostaw puste aby sprawdzić siebie)'))
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

    if (subcommand === 'dodaj_formularz') {
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
        .setLabel('Numer odznaki')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const typeInput = new TextInputBuilder()
        .setCustomId('godzinki_type')
        .setLabel('Rodzaj (nego, sv, mery, meryof, med)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const timeInput = new TextInputBuilder()
        .setCustomId('godzinki_time')
        .setLabel('Czas (np. 2h 30m, 1.5h, 45m)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(nameInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(badgeInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(typeInput),
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(timeInput)
      );

      await interaction.showModal(modal);
      return;
    }

    if (subcommand === 'dodaj_opcje') {
      const name = interaction.options.getString('imie_nazwisko', true);
      const badge = interaction.options.getString('odznaka', true);
      const type = interaction.options.getString('typ', true);
      const hours = interaction.options.getInteger('godziny', true);
      const minutes = interaction.options.getInteger('minuty', true);

      await client.prisma.dutyLog.create({
        data: {
          guildId: guild.id,
          userId: dbUser.id,
          name,
          badge,
          type,
          hours,
          minutes,
        },
      });

      await interaction.reply({
        embeds: [
          Embed.success('Zapisano raport', `Pomyślnie dodano szkolenie **${type}** dla **${name}** (${hours}h ${minutes}m).`)
        ],
      });
      return;
    }

    if (subcommand === 'statystyki') {
      const targetUser = interaction.options.getUser('osoba') || interaction.user;
      
      let targetDbUser = await client.prisma.user.findUnique({ where: { discordId: targetUser.id } });
      if (!targetDbUser) {
        await interaction.reply({ embeds: [Embed.warning('Brak Danych', 'Ta osoba nie ma jeszcze żadnych wpisów.')] });
        return;
      }

      const logs = await client.prisma.dutyLog.findMany({
        where: { guildId: guild.id, userId: targetDbUser.id },
      });

      if (logs.length === 0) {
        await interaction.reply({ embeds: [Embed.warning('Brak Danych', 'Brak zarejestrowanych szkoleń dla tej osoby.')] });
        return;
      }

      const typeCounts: Record<string, number> = {};
      let totalMinutes = 0;

      for (const log of logs) {
        typeCounts[log.type] = (typeCounts[log.type] || 0) + 1;
        totalMinutes += (log.hours * 60) + log.minutes;
      }

      const sumHours = Math.floor(totalMinutes / 60);
      const sumMins = totalMinutes % 60;

      const typesMap: Record<string, string> = {
        nego: 'Negocjacje (nego)',
        sv: 'Supervisory (sv)',
        mery: 'Merytoryka (mery)',
        meryof: 'Merytoryka Oficerska (meryof)',
        med: 'Medyczne (med)'
      };

      const fields = Object.entries(typeCounts).map(([type, count]) => {
        return { name: typesMap[type] || type.toUpperCase(), value: `${count} razy`, inline: true };
      });

      const embed = Embed.info(`Statystyki: ${targetUser.username}`)
        .setDescription(`Łączny czas: **${sumHours} godzin, ${sumMins} minut**\nŁącznie odbytych szkoleń: **${logs.length}**`)
        .addFields(fields)
        .setThumbnail(targetUser.displayAvatarURL());

      await interaction.reply({ embeds: [embed] });
    }
  }
}
