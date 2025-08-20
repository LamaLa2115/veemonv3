import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import { db } from '../../utils/database';

export default {
  data: new SlashCommandBuilder()
    .setName('prefix')
    .setDescription('Change or view the server prefix')
    .addSubcommand(subcommand =>
      subcommand
        .setName('set')
        .setDescription('Set a new prefix for this server')
        .addStringOption(option =>
          option.setName('prefix')
            .setDescription('The new prefix to use (1-5 characters)')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(5)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View the current server prefix')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset prefix to default')
    ),
  permissions: [PermissionFlagsBits.ManageGuild],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    
    const subcommand = interaction.options.getSubcommand();
    
    try {
      switch (subcommand) {
        case 'set': {
          const newPrefix = interaction.options.getString('prefix', true);
          
          // Validate prefix
          if (newPrefix.includes(' ')) {
            await interaction.reply({
              content: `${config.emojis.warn} Prefix cannot contain spaces.`,
              ephemeral: true,
            });
            return;
          }
          
          if (newPrefix.includes('@')) {
            await interaction.reply({
              content: `${config.emojis.warn} Prefix cannot contain @ mentions.`,
              ephemeral: true,
            });
            return;
          }
          
          // Save to database
          await db.setGuildPrefix(interaction.guild.id, newPrefix);
          
          const embed = new EmbedBuilder()
            .setTitle('✅ Prefix Updated')
            .setDescription(`Server prefix has been changed to \`${newPrefix}\``)
            .addFields(
              { name: 'Old Prefix', value: `\`${config.bot.defaultPrefix}\` (default)`, inline: true },
              { name: 'New Prefix', value: `\`${newPrefix}\``, inline: true },
              { name: 'Usage Example', value: `\`${newPrefix}help\``, inline: true }
            )
            .setColor(config.colors.success)
            .setTimestamp()
            .setFooter({
              text: `Changed by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'view': {
          const currentPrefix = await db.getGuildPrefix(interaction.guild.id) || config.bot.defaultPrefix;
          
          const embed = new EmbedBuilder()
            .setTitle('📋 Current Prefix')
            .setDescription(`The current prefix for this server is \`${currentPrefix}\``)
            .addFields(
              { name: 'Usage Example', value: `\`${currentPrefix}help\``, inline: true },
              { name: 'Default Prefix', value: `\`${config.bot.defaultPrefix}\``, inline: true },
              { name: 'Slash Commands', value: 'Always available with `/`', inline: true }
            )
            .setColor(config.colors.info)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'reset': {
          await db.setGuildPrefix(interaction.guild.id, config.bot.defaultPrefix);
          
          const embed = new EmbedBuilder()
            .setTitle('🔄 Prefix Reset')
            .setDescription(`Server prefix has been reset to the default: \`${config.bot.defaultPrefix}\``)
            .setColor(config.colors.success)
            .setTimestamp()
            .setFooter({
              text: `Reset by ${interaction.user.tag}`,
              iconURL: interaction.user.displayAvatarURL(),
            });
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
      }
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to update prefix. Please try again.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;