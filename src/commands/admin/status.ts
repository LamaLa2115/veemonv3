import { SlashCommandBuilder, ChatInputCommandInteraction, ActivityType } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Set the bot status (Owner only)')
    .addStringOption(option =>
      option.setName('activity')
        .setDescription('The activity text')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('type')
        .setDescription('The activity type')
        .addChoices(
          { name: 'Playing', value: ActivityType.Playing },
          { name: 'Watching', value: ActivityType.Watching },
          { name: 'Listening', value: ActivityType.Listening },
          { name: 'Competing', value: ActivityType.Competing }
        )
    ),
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const activity = interaction.options.getString('activity', true);
    const type = interaction.options.getInteger('type') ?? ActivityType.Playing;

    try {
      await interaction.client.user?.setPresence({
        activities: [{
          name: activity,
          type: type,
        }],
        status: 'online',
      });

      await interaction.reply({
        content: `${config.emojis.approve} Successfully set bot status to **${activity}**.`,
        ephemeral: true,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to set bot status.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
