import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ChannelType } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Get detailed information about this server'),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    
    await interaction.deferReply();

    try {
      const guild = interaction.guild;
      
      // Fetch additional guild data
      await guild.members.fetch();
      await guild.channels.fetch();
      
      // Channel counts
      const channels = guild.channels.cache;
      const textChannels = channels.filter(c => c.type === ChannelType.GuildText).size;
      const voiceChannels = channels.filter(c => c.type === ChannelType.GuildVoice).size;
      const categories = channels.filter(c => c.type === ChannelType.GuildCategory).size;
      const threads = channels.filter(c => c.isThread()).size;
      
      // Member counts
      const members = guild.members.cache;
      const humans = members.filter(m => !m.user.bot).size;
      const bots = members.filter(m => m.user.bot).size;
      const online = members.filter(m => m.presence?.status === 'online').size;
      const idle = members.filter(m => m.presence?.status === 'idle').size;
      const dnd = members.filter(m => m.presence?.status === 'dnd').size;
      const offline = members.filter(m => !m.presence || m.presence.status === 'offline').size;
      
      // Server features
      const features = guild.features.map(feature => {
        switch (feature) {
          case 'ANIMATED_BANNER': return 'Animated Banner';
          case 'ANIMATED_ICON': return 'Animated Icon';
          case 'BANNER': return 'Server Banner';
          case 'COMMERCE': return 'Commerce';
          case 'COMMUNITY': return 'Community Server';
          case 'DISCOVERABLE': return 'Server Discovery';
          case 'FEATURABLE': return 'Featurable';
          case 'INVITE_SPLASH': return 'Invite Splash';
          case 'MEMBER_VERIFICATION_GATE_ENABLED': return 'Membership Screening';
          case 'NEWS': return 'News Channels';
          case 'PARTNERED': return 'Partnered';
          case 'PREVIEW_ENABLED': return 'Preview Enabled';
          case 'VANITY_URL': return 'Vanity URL';
          case 'VERIFIED': return 'Verified';
          case 'VIP_REGIONS': return 'VIP Voice Regions';
          case 'WELCOME_SCREEN_ENABLED': return 'Welcome Screen';
          default: return feature.replace(/_/g, ' ');
        }
      }).join('\n') || 'None';

      // Verification levels
      const verificationLevels = {
        0: 'None',
        1: 'Low',
        2: 'Medium',
        3: 'High',
        4: 'Very High'
      };

      // Content filter levels
      const contentFilterLevels = {
        0: 'Disabled',
        1: 'Members without roles',
        2: 'All members'
      };

      const embed = new EmbedBuilder()
        .setAuthor({
          name: guild.name,
          iconURL: guild.iconURL({ size: 256 }) || undefined,
        })
        .setThumbnail(guild.iconURL({ size: 256 }))
        .setColor(config.colors.primary)
        .addFields(
          {
            name: '📋 General Information',
            value: [
              `**Name:** ${guild.name}`,
              `**ID:** ${guild.id}`,
              `**Owner:** <@${guild.ownerId}>`,
              `**Created:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
              `**Verification:** ${verificationLevels[guild.verificationLevel] || 'Unknown'}`,
              `**Content Filter:** ${contentFilterLevels[guild.explicitContentFilter] || 'Unknown'}`
            ].join('\n'),
            inline: false
          },
          {
            name: '👥 Members',
            value: [
              `**Total:** ${guild.memberCount}`,
              `**Humans:** ${humans}`,
              `**Bots:** ${bots}`,
              `**Online:** 🟢 ${online}`,
              `**Idle:** 🟡 ${idle}`,
              `**DND:** 🔴 ${dnd}`,
              `**Offline:** ⚫ ${offline}`
            ].join('\n'),
            inline: true
          },
          {
            name: '📺 Channels',
            value: [
              `**Total:** ${channels.size}`,
              `**Text:** ${textChannels}`,
              `**Voice:** ${voiceChannels}`,
              `**Categories:** ${categories}`,
              `**Threads:** ${threads}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🎭 Other',
            value: [
              `**Roles:** ${guild.roles.cache.size}`,
              `**Emojis:** ${guild.emojis.cache.size}`,
              `**Stickers:** ${guild.stickers.cache.size}`,
              `**Boosts:** ${guild.premiumSubscriptionCount || 0}`,
              `**Boost Level:** ${guild.premiumTier}`,
              `**AFK Timeout:** ${guild.afkTimeout / 60}min`
            ].join('\n'),
            inline: true
          }
        )
        .setTimestamp()
        .setFooter({
          text: `Requested by ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

      // Add server banner if available
      if (guild.bannerURL()) {
        embed.setImage(guild.bannerURL({ size: 1024 }));
      }

      // Add features if any
      if (features !== 'None') {
        embed.addFields({
          name: '✨ Server Features',
          value: features,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to fetch server information.`,
      });
    }
  },
} satisfies Command;