import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, GuildMember } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Get detailed information about a user')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to get information about (defaults to you)')
        .setRequired(false)
    ),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    
    if (!interaction.guild) return;
    
    await interaction.deferReply();

    try {
      const member = await interaction.guild.members.fetch(targetUser.id);
      
      // User flags (badges)
      const userFlags = targetUser.flags?.toArray() || [];
      const badges = userFlags.map(flag => {
        switch (flag) {
          case 'Staff': return '<:staff:123456789> Discord Staff';
          case 'Partner': return '<:partner:123456789> Discord Partner';
          case 'Hypesquad': return '<:hypesquad:123456789> HypeSquad Events';
          case 'BugHunterLevel1': return '<:bughunter1:123456789> Bug Hunter Level 1';
          case 'BugHunterLevel2': return '<:bughunter2:123456789> Bug Hunter Level 2';
          case 'HypeSquadOnlineHouse1': return '<:bravery:123456789> HypeSquad Bravery';
          case 'HypeSquadOnlineHouse2': return '<:brilliance:123456789> HypeSquad Brilliance';
          case 'HypeSquadOnlineHouse3': return '<:balance:123456789> HypeSquad Balance';
          case 'PremiumEarlySupporter': return '<:early:123456789> Early Nitro Supporter';
          case 'VerifiedBot': return '<:verifiedbot:123456789> Verified Bot';
          case 'VerifiedDeveloper': return '<:verifieddev:123456789> Early Verified Bot Developer';
          case 'CertifiedModerator': return '<:certifiedmod:123456789> Discord Certified Moderator';
          case 'BotHTTPInteractions': return '<:slashcommands:123456789> Uses Slash Commands';
          default: return flag;
        }
      }).join('\n') || 'None';

      // Get roles (excluding @everyone)
      const roles = member.roles.cache
        .filter(role => role.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(role => role.toString())
        .slice(0, 20); // Limit to 20 roles

      const embed = new EmbedBuilder()
        .setAuthor({
          name: targetUser.tag,
          iconURL: targetUser.displayAvatarURL({ size: 256 }),
        })
        .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
        .setColor(member.displayHexColor || config.colors.primary)
        .addFields(
          { 
            name: '📋 General Information', 
            value: [
              `**User:** ${targetUser}`,
              `**ID:** ${targetUser.id}`,
              `**Created:** <t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
              `**Bot:** ${targetUser.bot ? 'Yes' : 'No'}`
            ].join('\n'),
            inline: false 
          },
          { 
            name: '🏠 Server Information', 
            value: [
              `**Joined:** <t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:R>`,
              `**Nickname:** ${member.nickname || 'None'}`,
              `**Booster:** ${member.premiumSince ? `Since <t:${Math.floor(member.premiumSinceTimestamp! / 1000)}:R>` : 'No'}`
            ].join('\n'),
            inline: false 
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      // Add roles if any
      if (roles.length > 0) {
        const roleText = roles.length > 20 
          ? `${roles.slice(0, 20).join(' ')} and ${roles.length - 20} more...`
          : roles.join(' ');
        
        embed.addFields({
          name: `🎭 Roles (${member.roles.cache.size - 1})`,
          value: roleText || 'None',
          inline: false,
        });
      }

      // Add badges if any
      if (badges !== 'None') {
        embed.addFields({
          name: '🏆 Badges',
          value: badges,
          inline: false,
        });
      }

      // Add presence info if available
      if (member.presence) {
        const status = {
          online: '🟢 Online',
          idle: '🟡 Idle',
          dnd: '🔴 Do Not Disturb',
          offline: '⚫ Offline'
        }[member.presence.status] || '❓ Unknown';

        embed.addFields({
          name: '💡 Status',
          value: status,
          inline: true,
        });

        if (member.presence.activities.length > 0) {
          const activity = member.presence.activities[0];
          let activityText = `**${activity.name}**`;
          
          if (activity.details) activityText += `\n${activity.details}`;
          if (activity.state) activityText += `\n${activity.state}`;
          
          embed.addFields({
            name: '🎮 Activity',
            value: activityText,
            inline: true,
          });
        }
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to fetch user information. They may not be in this server.`,
      });
    }
  },
} satisfies Command;