import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, TextChannel, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specified number of messages from the channel')
    .addIntegerOption(option =>
      option
        .setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    )
    .addUserOption(option =>
      option
        .setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('reason')
        .setDescription('Reason for purging messages')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.channel) return;

    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = interaction.channel as TextChannel;
      
      // Fetch messages
      const messages = await channel.messages.fetch({ limit: amount });
      
      // Filter messages if specific user is targeted
      let messagesToDelete = Array.from(messages.values());
      if (targetUser) {
        messagesToDelete = messagesToDelete.filter(msg => msg.author.id === targetUser.id);
      }

      // Filter out messages older than 14 days (Discord limitation)
      const fourteenDaysAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
      const recentMessages = messagesToDelete.filter(msg => msg.createdTimestamp > fourteenDaysAgo);
      
      if (recentMessages.length === 0) {
        await interaction.editReply({
          content: `${config.emojis.deny} No messages found to delete. Messages older than 14 days cannot be bulk deleted.`
        });
        return;
      }

      // Bulk delete messages
      if (recentMessages.length === 1) {
        await recentMessages[0].delete();
      } else {
        await channel.bulkDelete(recentMessages, true);
      }

      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('🧹 Messages Purged')
        .setColor(config.colors.success)
        .addFields([
          { name: 'Messages Deleted', value: recentMessages.length.toString(), inline: true },
          { name: 'Channel', value: channel.toString(), inline: true },
          { name: 'Moderator', value: interaction.user.toString(), inline: true }
        ])
        .setTimestamp();

      if (targetUser) {
        embed.addFields([
          { name: 'Target User', value: targetUser.toString(), inline: true }
        ]);
      }

      if (reason !== 'No reason provided') {
        embed.addFields([
          { name: 'Reason', value: reason, inline: false }
        ]);
      }

      await interaction.editReply({ embeds: [embed] });

      // Log the action (if logging is enabled)
      try {
        const logChannel = interaction.guild.channels.cache.find(ch => 
          ch.name.includes('log') && ch.isTextBased()
        );
        
        if (logChannel && logChannel.isTextBased()) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🧹 Messages Purged')
            .setColor(config.colors.warning)
            .addFields([
              { name: 'Moderator', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
              { name: 'Channel', value: `${channel.name} (${channel.id})`, inline: true },
              { name: 'Messages Deleted', value: recentMessages.length.toString(), inline: true }
            ])
            .setTimestamp();

          if (targetUser) {
            logEmbed.addFields([
              { name: 'Target User', value: `${targetUser.tag} (${targetUser.id})`, inline: true }
            ]);
          }

          if (reason !== 'No reason provided') {
            logEmbed.addFields([
              { name: 'Reason', value: reason, inline: false }
            ]);
          }

          await logChannel.send({ embeds: [logEmbed] });
        }
      } catch (logError) {
        // Silently fail if logging doesn't work
      }

    } catch (error) {
      console.error('Purge command error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to purge messages. Make sure I have the necessary permissions.`
      });
    }
  },
} satisfies Command;