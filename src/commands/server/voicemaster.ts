import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import { db } from '../../utils/database';

export default {
  data: new SlashCommandBuilder()
    .setName('voicemaster')
    .setDescription('Configure join-to-create voice channels')
    .addSubcommand(subcommand =>
      subcommand
        .setName('setup')
        .setDescription('Set up join-to-create functionality')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('Voice channel to use as join-to-create trigger')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
        .addChannelOption(option =>
          option
            .setName('category')
            .setDescription('Category to create temporary channels in')
            .addChannelTypes(ChannelType.GuildCategory)
            .setRequired(false)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable join-to-create functionality')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View current voicemaster configuration')
    ),
  permissions: [PermissionFlagsBits.ManageChannels],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const subcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    switch (subcommand) {
      case 'setup':
        await this.handleSetup(interaction);
        break;
      case 'disable':
        await this.handleDisable(interaction);
        break;
      case 'status':
        await this.handleStatus(interaction);
        break;
    }
  },

  async handleSetup(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const joinChannel = interaction.options.getChannel('channel');
    const category = interaction.options.getChannel('category');

    if (!joinChannel) {
      await interaction.editReply({
        content: `${config.emojis.deny} Invalid voice channel specified.`
      });
      return;
    }

    try {
      // Save voicemaster configuration to database
      await db.prisma.voicemasterConfig.upsert({
        where: { guildId: interaction.guild.id },
        update: {
          joinChannelId: joinChannel.id,
          categoryId: category?.id || null,
          isEnabled: true,
        },
        create: {
          guildId: interaction.guild.id,
          joinChannelId: joinChannel.id,
          categoryId: category?.id || null,
          isEnabled: true,
        },
      });

      const embed = new EmbedBuilder()
        .setTitle('✅ Voicemaster Setup Complete')
        .setDescription('Join-to-create voice channels have been configured!')
        .addFields(
          { name: 'Join-to-Create Channel', value: `<#${joinChannel.id}>`, inline: true },
          { name: 'Category', value: category ? `<#${category.id}>` : 'Server default', inline: true },
          { name: 'Status', value: '🟢 Enabled', inline: true }
        )
        .addFields(
          { name: 'How it works:', value: 'When users join the specified voice channel, a temporary channel will be created for them with full control permissions.' }
        )
        .setColor(config.colors.success)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Voicemaster setup error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to configure voicemaster system.`
      });
    }
  },

  async handleDisable(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    try {
      await db.prisma.voicemasterConfig.update({
        where: { guildId: interaction.guild.id },
        data: { isEnabled: false },
      });

      const embed = new EmbedBuilder()
        .setTitle('🔴 Voicemaster Disabled')
        .setDescription('Join-to-create functionality has been disabled.')
        .addFields(
          { name: 'Status', value: '🔴 Disabled', inline: true },
          { name: 'Note', value: 'Existing temporary channels will remain active', inline: false }
        )
        .setColor(config.colors.warning)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Voicemaster disable error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to disable voicemaster system.`
      });
    }
  },

  async handleStatus(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    try {
      const vmConfig = await db.prisma.voicemasterConfig.findUnique({
        where: { guildId: interaction.guild.id },
      });

      if (!vmConfig) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Voicemaster Not Configured')
          .setDescription('Join-to-create voice channels are not set up in this server.')
          .addFields(
            { name: 'Setup', value: 'Use `/voicemaster setup` to configure the system', inline: false }
          )
          .setColor(config.colors.error)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      const activeChannels = await db.prisma.voiceChannel.count({
        where: { guildId: interaction.guild.id },
      });

      const embed = new EmbedBuilder()
        .setTitle('🎙️ Voicemaster Status')
        .setDescription('Current join-to-create configuration')
        .addFields(
          { name: 'Status', value: vmConfig.isEnabled ? '🟢 Enabled' : '🔴 Disabled', inline: true },
          { name: 'Join Channel', value: `<#${vmConfig.joinChannelId}>`, inline: true },
          { name: 'Category', value: vmConfig.categoryId ? `<#${vmConfig.categoryId}>` : 'Server default', inline: true },
          { name: 'Active Temp Channels', value: activeChannels.toString(), inline: true },
          { name: 'Created', value: `<t:${Math.floor(vmConfig.createdAt.getTime() / 1000)}:R>`, inline: true },
          { name: 'Last Updated', value: `<t:${Math.floor(vmConfig.updatedAt.getTime() / 1000)}:R>`, inline: true }
        )
        .setColor(vmConfig.isEnabled ? config.colors.success : config.colors.warning)
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Voicemaster status error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to retrieve voicemaster status.`
      });
    }
  },
} satisfies Command;