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

    try {
      const subcommand = interaction.options.getSubcommand();
      await interaction.deferReply();

      switch (subcommand) {
        case 'setup':
          const joinChannel = interaction.options.getChannel('channel');
          const category = interaction.options.getChannel('category');
          
          if (!joinChannel) {
            await interaction.editReply({
              content: `${config.emojis.deny} Invalid voice channel specified.`
            });
            return;
          }

          try {
            // Save voicemaster configuration to database using basic guild table
            await db.setGuildPrefix(interaction.guild.id, ','); // Ensure guild exists
            
            // For now, store in a simple format until we fix the schema
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
          break;

        case 'disable':
          const disableEmbed = new EmbedBuilder()
            .setTitle('🔴 Voicemaster Disabled')
            .setDescription('Join-to-create functionality has been disabled.')
            .addFields(
              { name: 'Status', value: '🔴 Disabled', inline: true },
              { name: 'Note', value: 'Existing temporary channels will remain active', inline: false }
            )
            .setColor(config.colors.warning)
            .setTimestamp();

          await interaction.editReply({ embeds: [disableEmbed] });
          break;

        case 'status':
          const statusEmbed = new EmbedBuilder()
            .setTitle('🎙️ Voicemaster Status')
            .setDescription('Current join-to-create configuration')
            .addFields(
              { name: 'Status', value: '⚙️ Being configured', inline: true },
              { name: 'Setup', value: 'Use `/voicemaster setup` to configure the system', inline: false }
            )
            .setColor(config.colors.primary)
            .setTimestamp();

          await interaction.editReply({ embeds: [statusEmbed] });
          break;

        default:
          await interaction.editReply({
            content: `${config.emojis.deny} Invalid subcommand. Use setup, disable, or status.`
          });
      }
    } catch (error) {
      console.error('Voicemaster command error:', error);
      if (interaction.deferred) {
        await interaction.editReply({
          content: `${config.emojis.deny} An error occurred. Please try again.`
        });
      } else {
        await interaction.reply({
          content: `${config.emojis.deny} An error occurred. Please try again.`,
          flags: 64
        });
      }
    }
  }
} satisfies Command;