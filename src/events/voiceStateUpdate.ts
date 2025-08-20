import { Events, VoiceState } from 'discord.js';
import { Event } from '../types/index.js';
import { VoiceChannelManager } from '../services/voiceChannels.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    try {
      await VoiceChannelManager.handleVoiceStateUpdate(oldState, newState);
    } catch (error) {
      logger.error('Error handling voice state update:', error);
    }
  },
} satisfies Event;
