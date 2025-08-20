import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the ban')
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('delete-days')
        .setDescription('Delete messages from the last X days (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.BanMembers],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete-days') || 0;

    if (!interaction.guild) return;

    // Check if user is trying to ban themselves
    if (user.id === interaction.user.id) {
      await interaction.reply({
        content: `${config.emojis.warn} You cannot ban yourself!`,
        ephemeral: true,
      });
      return;
    }

    // Check if user is trying to ban a bot owner
    if (user.id === config.discord.ownerId) {
      await interaction.reply({
        content: `${config.emojis.deny} You cannot ban the bot owner!`,
        ephemeral: true,
      });
      return;
    }

    try {
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      
      // Check role hierarchy
      if (member && interaction.member && typeof interaction.member.permissions !== 'string') {
        const memberHighestRole = member.roles.highest;
        const moderatorHighestRole = (interaction.member as any).roles.highest;
        
        if (memberHighestRole.position >= moderatorHighestRole.position) {
          await interaction.reply({
            content: `${config.emojis.deny} You cannot ban someone with a higher or equal role!`,
            ephemeral: true,
          });
          return;
        }
      }

      // Try to DM user before banning
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('You have been banned')
          .setDescription(`You have been banned from **${interaction.guild.name}**`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: interaction.user.tag, inline: false }
          )
          .setColor(config.colors.error)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch {
        // User has DMs disabled or blocked the bot
      }

      // Ban the user
      await interaction.guild.members.ban(user, {
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageDays: deleteDays,
      });

      const embed = new EmbedBuilder()
        .setTitle('User Banned')
        .setDescription(`${config.emojis.approve} **${user.tag}** has been banned from the server`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setColor(config.colors.error)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      if (deleteDays > 0) {
        embed.addFields({ name: 'Messages Deleted', value: `${deleteDays} day(s)`, inline: true });
      }

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to ban the user. They may have already left the server or I lack permissions.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;