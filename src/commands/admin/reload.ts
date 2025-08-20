import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command, ExtendedClient } from '../../types/index.js';
import { config } from '../../config/config.js';
import { loadCommands } from '../../handlers/command.js';
import { logger } from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reload all commands (Owner only)'),
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const client = interaction.client as ExtendedClient;
      
      // Clear existing commands
      client.commands.clear();
      
      // Reload commands
      await loadCommands(client);
      
      await interaction.editReply({
        content: `${config.emojis.approve} Successfully reloaded ${client.commands.size} commands.`,
      });
      
      logger.info(`Commands reloaded by ${interaction.user.tag}`);
    } catch (error) {
      logger.error('Error reloading commands:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to reload commands.`,
      });
    }
  },
} satisfies Command;
