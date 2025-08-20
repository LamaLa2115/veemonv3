import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import { db } from '../../utils/database';

export default {
  data: new SlashCommandBuilder()
    .setName('vcpanel')
    .setDescription('Create a permanent voice channel control panel'),
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    await interaction.deferReply();

    try {
      const embed = new EmbedBuilder()
        .setTitle('🎙️ Voice Channel Control Panel')
        .setDescription('Use the buttons below to control your temporary voice channels.')
        .addFields([
          { name: '🔒 Lock/Unlock', value: 'Control who can join your channel', inline: true },
          { name: '👥 Set Limit', value: 'Set user limit for your channel', inline: true },
          { name: '📝 Rename', value: 'Change your channel name', inline: true },
          { name: '🚫 Kick User', value: 'Remove users from your channel', inline: true },
          { name: '👑 Transfer', value: 'Give ownership to another user', inline: true },
          { name: '🗑️ Delete', value: 'Delete your temporary channel', inline: true },
          { name: 'ℹ️ Info', value: 'View channel information', inline: true },
          { name: '📋 How to Use', value: 'You must be in a temporary voice channel to use these controls', inline: false }
        ])
        .setColor(config.colors.primary)
        .setFooter({ text: 'Only works with temporary voice channels you own' })
        .setTimestamp();

      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('vc_lock')
            .setLabel('🔒 Lock')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('vc_unlock')
            .setLabel('🔓 Unlock')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('vc_limit')
            .setLabel('👥 Set Limit')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('vc_rename')
            .setLabel('📝 Rename')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('vc_kick')
            .setLabel('🚫 Kick User')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('vc_transfer')
            .setLabel('👑 Transfer')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('vc_delete')
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('vc_info')
            .setLabel('ℹ️ Info')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.editReply({
        embeds: [embed],
        components: [row1, row2]
      });

    } catch (error) {
      console.error('VCPanel command error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to create voice channel control panel.`
      });
    }
  },
} satisfies Command;