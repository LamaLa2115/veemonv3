import { 
  VoiceState, 
  GuildMember, 
  VoiceChannel, 
  ChannelType, 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  CategoryChannel 
} from 'discord.js';
import { db } from '../utils/database';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export class VoicemasterService {
  
  static async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
    // Handle join-to-create functionality
    await this.handleJoinToCreate(newState);
    
    // Handle temp channel cleanup
    await this.handleTempChannelCleanup(oldState);
  }

  private static async handleJoinToCreate(newState: VoiceState) {
    if (!newState.channel || !newState.guild) return;

    try {
      // For testing, let's use a hardcoded channel ID or name pattern
      // You can replace this with your actual join-to-create channel ID
      const JOIN_TO_CREATE_NAMES = ['Join to Create', 'Create Channel', '➕ Join to Create'];
      const isJoinToCreateChannel = JOIN_TO_CREATE_NAMES.some(name => 
        newState.channel?.name.toLowerCase().includes(name.toLowerCase())
      );

      if (!isJoinToCreateChannel) return;

      // Create temporary voice channel
      await this.createTempChannel(newState.member!);

    } catch (error) {
      logger.error('Error handling join-to-create:', error);
    }
  }

  private static async handleTempChannelCleanup(oldState: VoiceState) {
    if (!oldState.channel || !oldState.guild) return;

    try {
      // Check if this is a temporary voice channel by name pattern
      const isTempChannel = oldState.channel.name.includes("'s Channel") || 
                           oldState.channel.name.includes('Temp');

      if (!isTempChannel) return;

      // Check if this channel exists in our database
      const tempChannel = await db.getVoiceChannel(oldState.channelId!);
      
      const channel = oldState.channel as VoiceChannel;
      
      // If channel is now empty, delete it
      if (channel.members.size === 0) {
        await channel.delete('Empty voicemaster channel cleanup');
        
        if (tempChannel) {
          await db.deleteVoiceChannel(oldState.channelId!);
        }
        
        logger.debug(`Cleaned up empty voicemaster channel: ${channel.name}`);
      }

    } catch (error) {
      logger.error('Error handling temp channel cleanup:', error);
    }
  }

  private static async createTempChannel(member: GuildMember) {
    try {
      const guild = member.guild;

      // Generate channel name
      const channelName = `${member.displayName}'s Channel`;

      // Try to find a suitable category
      const category = guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildCategory)
        .find(ch => ch.name.toLowerCase().includes('voice') || ch.name.toLowerCase().includes('temp')) as CategoryChannel;

      // Create the voice channel
      const tempChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category || null,
        userLimit: 0,
        permissionOverwrites: [
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ManageChannels,
              PermissionFlagsBits.MoveMembers,
              PermissionFlagsBits.Connect,
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ViewChannel
            ],
          },
          {
            id: guild.roles.everyone.id,
            allow: [
              PermissionFlagsBits.Connect, 
              PermissionFlagsBits.Speak,
              PermissionFlagsBits.ViewChannel
            ],
          },
        ],
      });

      // Save to database
      await db.createVoiceChannel(tempChannel.id, member.id, guild.id);

      // Move user to new channel
      await member.voice.setChannel(tempChannel);

      // Send control panel
      await this.sendVoicemasterControls(tempChannel, member);

      logger.debug(`Created voicemaster channel: ${channelName} for ${member.displayName}`);

    } catch (error) {
      logger.error('Error creating temp channel:', error);
    }
  }

  private static async sendVoicemasterControls(channel: VoiceChannel, owner: GuildMember) {
    try {
      const embed = new EmbedBuilder()
        .setTitle('🎙️ Voice Channel Controls')
        .setDescription(`**${owner.displayName}** owns this voice channel!`)
        .addFields([
          { name: '🔒 Lock/Unlock', value: 'Control who can join', inline: true },
          { name: '👥 Set Limit', value: 'Set user limit (0-99)', inline: true },
          { name: '📝 Rename', value: 'Change channel name', inline: true },
          { name: '🚫 Kick User', value: 'Remove user from channel', inline: true },
          { name: '👑 Transfer', value: 'Give ownership to another user', inline: true },
          { name: '🗑️ Delete', value: 'Delete this channel', inline: true }
        ])
        .setColor(config.colors.primary)
        .setTimestamp();

      const row1 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`vm_lock_${channel.id}`)
            .setLabel('🔒 Lock')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`vm_unlock_${channel.id}`)
            .setLabel('🔓 Unlock')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`vm_limit_${channel.id}`)
            .setLabel('👥 Limit')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(`vm_rename_${channel.id}`)
            .setLabel('📝 Rename')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`vm_kick_${channel.id}`)
            .setLabel('🚫 Kick')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`vm_transfer_${channel.id}`)
            .setLabel('👑 Transfer')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(`vm_delete_${channel.id}`)
            .setLabel('🗑️ Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId(`vm_info_${channel.id}`)
            .setLabel('ℹ️ Info')
            .setStyle(ButtonStyle.Secondary)
        );

      // Find a suitable text channel to send the controls
      const textChannel = channel.guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(channel.guild.members.me!)?.has('SendMessages'))
        .find(ch => ch.name.includes('general') || ch.name.includes('voice') || ch.name.includes('bot')) ||
        channel.guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildText && ch.permissionsFor(channel.guild.members.me!)?.has('SendMessages'))
        .first();

      if (textChannel && textChannel.isTextBased()) {
        await textChannel.send({
          content: `<@${owner.id}> Your voice channel controls:`,
          embeds: [embed],
          components: [row1, row2]
        });
      }

    } catch (error) {
      logger.error('Error sending voicemaster controls:', error);
    }
  }
}