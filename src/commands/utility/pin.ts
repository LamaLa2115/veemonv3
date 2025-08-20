import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pin')
    .setDescription('Pin a message by ID')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('The message ID to pin')
        .setRequired(true)
    ),
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const messageId = interaction.options.getString('message_id', true);

    try {
      const message = await interaction.channel?.messages.fetch(messageId);
      
      if (!message) {
        await interaction.reply({
          content: `${config.emojis.warn} Message not found in this channel.`,
          ephemeral: true,
        });
        return;
      }

      await message.pin();
      
      await interaction.reply({
        content: `${config.emojis.approve} Successfully pinned message.`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to pin message. Make sure the message ID is valid and I have permissions to pin messages.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
