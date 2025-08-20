import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('setbanner')
    .setDescription('Set the server banner')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The banner image URL')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Upload a banner image')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    // Check if guild has banner feature
    if (!interaction.guild.features.includes('BANNER')) {
      await interaction.reply({
        content: `${config.emojis.deny} This server doesn't have access to banners. Requires Server Level 2.`,
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

    const bannerUrl = attachment ? attachment.url : url!;

    try {
      await interaction.guild.setBanner(bannerUrl);
      await interaction.reply({
        content: `${config.emojis.approve} Successfully set the server banner to [**this image**](${bannerUrl}).`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to set server banner. Make sure the image is valid and under 8MB.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
