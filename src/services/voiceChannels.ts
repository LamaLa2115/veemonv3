import { VoiceState, ChannelType, PermissionFlagsBits } from 'discord.js';
import { config } from '../config/config';
import { db } from '../utils/database';
import { logger } from '../utils/logger';

export class VoiceChannelManager {
  private static tempChannels = new Map<string, string>(); // channelId -> ownerId

  public static async handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState): Promise<void> {
    // User joined a channel
    if (!oldState.channelId && newState.channelId) {
      await this.handleUserJoined(newState);
    }
    
    // User left a channel
    if (oldState.channelId && !newState.channelId) {
      await this.handleUserLeft(oldState);
    }
    
    // User switched channels
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      await this.handleUserLeft(oldState);
      await this.handleUserJoined(newState);
    }
  }

  private static async handleUserJoined(state: VoiceState): Promise<void> {
    if (!state.channel || !state.member || !config.bot.joinToCreateChannelId) return;
    
    // Check if user joined the "join to create" channel
    if (state.channelId === config.bot.joinToCreateChannelId) {
      await this.createTempChannel(state);
    }
  }

  private static async handleUserLeft(state: VoiceState): Promise<void> {
    if (!state.channel || !state.channelId) return;
    
    // Check if it's a temp channel and if it's empty
    const dbChannel = await db.getVoiceChannel(state.channelId);
    if (dbChannel) {
      const channel = state.guild?.channels.cache.get(state.channelId);
      if (channel && 'members' in channel && channel.members.size === 0) {
        await this.deleteTempChannel(state.channelId);
      }
    }
  }

  private static async createTempChannel(state: VoiceState): Promise<void> {
    if (!state.member || !state.guild) return;

    try {
      const channel = await state.guild.channels.create({
        name: `${state.member.user.username}'s room`,
        type: ChannelType.GuildVoice,
        parent: state.channel?.parent,
        permissionOverwrites: [
          {
            id: state.member.id,
            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.MoveMembers],
          },
          {
            id: state.guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect],
          },
        ],
      });

      // Move user to the new channel
      await state.setChannel(channel);
      
      // Store in database
      await db.createVoiceChannel(channel.id, state.member.id, state.guild.id);
      
      this.tempChannels.set(channel.id, state.member.id);
      
      logger.debug(`Created temp voice channel for ${state.member.user.username}`);
    } catch (error) {
      logger.error('Failed to create temp voice channel:', error);
    }
  }

  private static async deleteTempChannel(channelId: string): Promise<void> {
    try {
      const channel = await db.getVoiceChannel(channelId);
      if (!channel) return;

      const discordChannel = await channel.guildId && 
        await (await import('discord.js')).Client.prototype.guilds.cache
          .get(channel.guildId)?.channels.fetch(channelId);
      
      if (discordChannel) {
        await discordChannel.delete();
      }
      
      await db.deleteVoiceChannel(channelId);
      this.tempChannels.delete(channelId);
      
      logger.debug(`Deleted temp voice channel ${channelId}`);
    } catch (error) {
      logger.error('Failed to delete temp voice channel:', error);
    }
  }

  // Cleanup orphaned channels on startup
  public static async cleanup(): Promise<void> {
    // This would be called on bot startup to clean up any orphaned channels
    // Implementation would check database vs actual Discord channels
  }
}
