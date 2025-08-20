import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('seticon')
    .setDescription('Set the server icon')
    .addStringOption(option =>
      option.setName('url')
        .setDescription('The icon image URL')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('attachment')
        .setDescription('Upload an icon image')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const url = interaction.options.getString('url');
    const attachment = interaction.options.getAttachment('attachment');
    
    if (!url && !attachment) {
      await interaction.reply({
        content: `${config.emojis.warn} Please provide either a URL or upload an image.`,
        ephemeral: true,
      });
      return;
    }

    const iconUrl = attachment ? attachment.url : url!;

    try {
      await interaction.guild.setIcon(iconUrl);
      await interaction.reply({
        content: `${config.emojis.approve} Successfully set the server icon to [**this image**](${iconUrl}).`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to set server icon. Make sure the image is valid and under 8MB.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
