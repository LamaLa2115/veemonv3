import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import ms from 'ms';

export default {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user for a specified duration')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to timeout')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('duration')
        .setDescription('Duration (e.g., 10m, 1h, 2d)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the timeout')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ModerateMembers],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser('user', true);
    const durationString = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (!interaction.guild) return;

    // Check if user is trying to timeout themselves
    if (user.id === interaction.user.id) {
      await interaction.reply({
        content: `${config.emojis.warn} You cannot timeout yourself!`,
        ephemeral: true,
      });
      return;
    }

    // Check if user is trying to timeout the bot owner
    if (user.id === config.discord.ownerId) {
      await interaction.reply({
        content: `${config.emojis.deny} You cannot timeout the bot owner!`,
        ephemeral: true,
      });
      return;
    }

    // Parse duration
    const duration = ms(durationString);
    if (!duration || duration < 5000 || duration > 2419200000) { // 5 seconds to 28 days
      await interaction.reply({
        content: `${config.emojis.warn} Invalid duration! Use a format like \`10m\`, \`1h\`, \`2d\` (minimum 5s, maximum 28d)`,
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
            content: `${config.emojis.deny} You cannot timeout someone with a higher or equal role!`,
            ephemeral: true,
          });
          return;
        }
      }

      // Try to DM user before timeout
      try {
        const dmEmbed = new EmbedBuilder()
          .setTitle('You have been timed out')
          .setDescription(`You have been timed out in **${interaction.guild.name}**`)
          .addFields(
            { name: 'Duration', value: ms(duration, { long: true }), inline: true },
            { name: 'Reason', value: reason, inline: false },
            { name: 'Moderator', value: interaction.user.tag, inline: false }
          )
          .setColor(config.colors.warning)
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] });
      } catch {
        // User has DMs disabled or blocked the bot
      }

      // Timeout the user
      await member.timeout(duration, `${reason} | Timed out by ${interaction.user.tag}`);

      const embed = new EmbedBuilder()
        .setTitle('User Timed Out')
        .setDescription(`${config.emojis.approve} **${user.tag}** has been timed out`)
        .addFields(
          { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
          { name: 'Duration', value: ms(duration, { long: true }), inline: true },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason, inline: false }
        )
        .setColor(config.colors.warning)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Failed to timeout the user. They may have already left the server or I lack permissions.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;