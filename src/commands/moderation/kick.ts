import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the kick')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.KickMembers],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!interaction.guild) return;

    // Check if user is trying to kick themselves
    if (user.id === interaction.user.id) {
      await interaction.reply({
        content: `${config.emojis.warn} You cannot kick yourself!`,
        ephemeral: true,
      });
      return;
    }

    // Check if user is trying to kick the bot owner
    if (user.id === config.discord.ownerId) {
      await interaction.reply({
        content: `${config.emojis.deny} You cannot kick the bot owner!`,
        ephemeral: true,
      });
      return;
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      
      // Check role hierarchy
      if (interaction.member && typeof interaction.member.permissions !== 'string') {
        const memberHighestRole = member.roles.highest;
        const moderatorHighestRole = (interaction.member as any).roles.highest;
        
        if (memberHighestRole.position >= moderatorHighestRole.position) {
          await interaction.reply({
            content: `${config.emojis.deny} You cannot kick someone with a higher or equal role!`,
            ephemeral: true,
          });
          return;
        }
      }

      // Try to DM user before kicking
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('You have been kicked')
          .setDescription(`You have been kicked from **${interaction.guild.name}**`)
          .addFields(
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: interaction.user.tag, inline: false }
          )
          .setColor(config.colors.warning)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch {
        // User has DMs disabled or blocked the bot
      }

      // Kick the user
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setDescription(`${config.emojis.approve} **${user.tag}** has been kicked from the server`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setColor(config.colors.warning)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to kick the user. They may have already left the server or I lack permissions.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;