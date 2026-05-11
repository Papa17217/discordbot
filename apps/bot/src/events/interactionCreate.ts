// ============================================
// Event: InteractionCreate — Command Router
// ============================================

import { Event } from '../structures/Event';
import { Interaction } from 'discord.js';
import { checkCooldown } from '../utils/cooldowns';
import { Embed } from '../structures/Embed';
import { logger } from '../utils/logger';
import type { BotClient } from '../client';

export default class InteractionCreateEvent extends Event<'interactionCreate'> {
  constructor() {
    super({ name: 'interactionCreate' });
  }

  async execute(client: BotClient, interaction: Interaction) {
    if (interaction.isButton()) {
      const { handleTicketButton } = require('../handlers/ticketHandler');
      const { handleReactionRoleButton } = require('../handlers/reactionRoleHandler');
      
      if (interaction.customId.startsWith('ticket_') || interaction.customId.startsWith('ticket:')) {
        return handleTicketButton(client, interaction);
      }
      
      if (interaction.customId.startsWith('rr_')) {
        return handleReactionRoleButton(client, interaction);
      }
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    // ── Cooldown Check ───────────────────────
    const { onCooldown, remaining } = await checkCooldown(
      interaction.user.id,
      interaction.commandName,
      command.cooldown,
    );

    if (onCooldown) {
      await interaction.reply({
        embeds: [Embed.warning('Cooldown', `Poczekaj jeszcze **${remaining}s** przed użyciem tej komendy.`)],
        ephemeral: true,
      });
      return;
    }

    // ── Execute Command ──────────────────────
    logger.info(`⌨️ Komenda /${interaction.commandName} użyta przez ${interaction.user.tag} na serwerze ${interaction.guild?.name || 'DM'}`);

    try {
      await command.execute(interaction, client);


      // Zapisz użycie komendy w analytics
      if (interaction.guildId) {
        const guild = await client.prisma.guild.findUnique({
          where: { discordId: interaction.guildId },
        });

        if (guild) {
          // Znajdź lub utwórz usera
          let user = await client.prisma.user.findUnique({
            where: { discordId: interaction.user.id },
          });
          if (!user) {
            user = await client.prisma.user.create({
              data: {
                discordId: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.avatar,
              },
            });
          }

          await client.prisma.commandUsage.create({
            data: {
              guildId: guild.id,
              commandName: interaction.commandName,
              userId: user.id,
            },
          });
        }
      }
    } catch (error) {
      logger.error(`Błąd komendy /${interaction.commandName}:`, error);

      const errorEmbed = Embed.error('Wystąpił błąd', 'Coś poszło nie tak. Spróbuj ponownie.');

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    }
  }
}
