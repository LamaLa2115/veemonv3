import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import { db } from '../../utils/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('afk')
    .setDescription('Set your AFK status')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Your AFK message')
        .setRequired(false)
    ),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const message = interaction.options.getString('message') ?? 'AFK';

    try {
      await db.setAfk(interaction.user.id, interaction.user.username, message);

      await interaction.reply({
        content: `${config.emojis.approve} You're now AFK with the status: **${message}**`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to set AFK status.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
