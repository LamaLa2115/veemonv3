import { Events, VoiceState } from 'discord.js';
import { Event } from '../types/index';
import { VoicemasterService } from '../services/voicemaster';
import { logger } from '../utils/logger';

export default {
  name: Events.VoiceStateUpdate,
  async execute(oldState: VoiceState, newState: VoiceState) {
    try {
      await VoicemasterService.handleVoiceStateUpdate(oldState, newState);
    } catch (error) {
      logger.error('Error in voiceStateUpdate event:', error);
    }
  },
} satisfies Event;
