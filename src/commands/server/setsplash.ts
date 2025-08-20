import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setsplash')
    .setDescription('Set the server splash screen')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The splash image URL')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Upload a splash image')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // Check if guild has invite splash feature
    if (!interaction.guild.features.includes('INVITE_SPLASH')) {
      await interaction.reply({
        content: `${config.emojis.deny} This server doesn't have access to splash screens. Requires Server Level 1.`,
        ephemeral: true,
      });
      return;
    }

    const url = interaction.options.getString('url');
    const attachment = interaction.options.getAttachment('attachment');
    
    if (!url && !attachment) {
      await interaction.reply({
        content: `${config.emojis.warn} Please provide either a URL or upload an image.`,
        ephemeral: true,
      });
      return;
    }

    const splashUrl = attachment ? attachment.url : url!;

    try {
      await interaction.guild.setSplash(splashUrl);
      await interaction.reply({
        content: `${config.emojis.approve} Successfully set the server splash to [**this image**](${splashUrl}).`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to set server splash. Make sure the image is valid and under 8MB.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
