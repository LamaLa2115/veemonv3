import { Events, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Event, ExtendedClient } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { config } from '../config/config.js';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.isChatInputCommand()) return;

    const client = interaction.client as ExtendedClient;
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      logger.warn(`Unknown command: ${interaction.commandName}`);
      return;
    }

    // Check if command is owner only
    if (command.ownerOnly && interaction.user.id !== config.discord.ownerId) {
      await interaction.reply({
        content: `${config.emojis.deny} This command is restricted to the bot owner.`,
        ephemeral: true,
      });
      return;
    }

    // Check if command requires guild
    if (command.guildOnly && !interaction.guild) {
      await interaction.reply({
        content: `${config.emojis.warn} This command can only be used in a server.`,
        ephemeral: true,
      });
      return;
    }

    // Check permissions
    if (command.permissions && interaction.guild) {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const hasPermissions = command.permissions.every(permission =>
        member.permissions.has(permission)
      );

      if (!hasPermissions) {
        await interaction.reply({
          content: `${config.emojis.warn} You don't have the required permissions to use this command.`,
          ephemeral: true,
        });
        return;
      }
    }

    // Check cooldowns
    if (command.cooldown) {
      const cooldowns = client.cooldowns;
      const commandName = command.data.name;
      const userId = interaction.user.id;

      if (!cooldowns.has(commandName)) {
        cooldowns.set(commandName, new Map());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(commandName)!;
      const cooldownAmount = command.cooldown * 1000;

      if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId)! + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await interaction.reply({
            content: `${config.emojis.warn} Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`,
            ephemeral: true,
          });
          return;
        }
      }

      timestamps.set(userId, now);
      setTimeout(() => timestamps.delete(userId), cooldownAmount);
    }

    try {
      await command.execute(interaction);
      logger.debug(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
    } catch (error) {
      logger.error(`Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = {
        content: `${config.emojis.deny} An error occurred while executing this command.`,
        ephemeral: true,
      };

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  },
} satisfies Event;
