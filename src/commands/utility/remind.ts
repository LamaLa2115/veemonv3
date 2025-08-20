import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import { db } from '../../utils/database.js';
import { addMilliseconds } from 'date-fns';

export default {
  data: new SlashCommandBuilder()
    .setName('remind')
    .setDescription('Set a reminder')
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g., 1h, 30m, 1d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('message')
        .setDescription('What to remind you about')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const duration = interaction.options.getString('duration', true);
    const reminderMessage = interaction.options.getString('message', true);

    // Parse duration
    const timeMatch = duration.match(/^(\d+)([smhd])$/);
    if (!timeMatch) {
      await interaction.reply({
        content: `${config.emojis.warn} Invalid duration format. Use format like: 1h, 30m, 1d`,
        ephemeral: true,
      });
      return;
    }

    const amount = parseInt(timeMatch[1]);
    const unit = timeMatch[2];
    
    let milliseconds = 0;
    switch (unit) {
      case 's':
        milliseconds = amount * 1000;
        break;
      case 'm':
        milliseconds = amount * 60 * 1000;
        break;
      case 'h':
        milliseconds = amount * 60 * 60 * 1000;
        break;
      case 'd':
        milliseconds = amount * 24 * 60 * 60 * 1000;
        break;
    }

    if (milliseconds > 365 * 24 * 60 * 60 * 1000) { // 1 year max
      await interaction.reply({
        content: `${config.emojis.warn} Reminder duration cannot exceed 1 year.`,
        ephemeral: true,
      });
      return;
    }

    const remindAt = addMilliseconds(new Date(), milliseconds);

    try {
      await db.createReminder(
        interaction.user.id,
        interaction.guildId!,
        reminderMessage,
        remindAt
      );

      await interaction.reply({
        content: `${config.emojis.approve} I'll remind you in **${duration}** about: **${reminderMessage}**`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to create reminder.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
