import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('unpin')
    .setDescription('Unpin a message by ID')
    .addStringOption(option =>
      option.setName('message_id')
        .setDescription('The message ID to unpin')
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

      if (!message.pinned) {
        await interaction.reply({
          content: `${config.emojis.warn} This message is not pinned.`,
          ephemeral: true,
        });
        return;
      }

      await message.unpin();
      
      await interaction.reply({
        content: `${config.emojis.approve} Successfully unpinned message.`,
      });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to unpin message. Make sure the message ID is valid and I have permissions to manage messages.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
