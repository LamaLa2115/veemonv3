import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('createembed')
    .setDescription('Create a custom embed from JSON')
    .addStringOption(option =>
      option.setName('json')
        .setDescription('The embed JSON data')
        .setRequired(true)
    ),
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const jsonData = interaction.options.getString('json', true);

    try {
      const embedData = JSON.parse(jsonData);
      const { text = '', ...embedOptions } = embedData;

      // Process thumbnail and image URLs
      if (embedOptions.thumbnail && typeof embedOptions.thumbnail === 'string') {
        embedOptions.thumbnail = { url: embedOptions.thumbnail };
      }
      if (embedOptions.image && typeof embedOptions.image === 'string') {
        embedOptions.image = { url: embedOptions.image };
      }

      const messageOptions: any = {};
      
      if (text) {
        messageOptions.content = text;
      }
      
      if (Object.keys(embedOptions).length > 0) {
        messageOptions.embeds = [embedOptions];
      }

      await interaction.reply(messageOptions);
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.warn} Invalid JSON format. Please check your embed code.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
