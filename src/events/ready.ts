import { Events, Client } from 'discord.js';
import { Event } from '../types/index';
import { logger } from '../utils/logger';

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client<true>) {
    logger.info(`Logged in as ${client.user.tag}`);
    logger.info(`Ready to serve ${client.guilds.cache.size} guilds`);
    
    // Start reminder checker
    setInterval(async () => {
      try {
        const { checkReminders } = await import('../services/reminderService');
        await checkReminders(client);
      } catch (error) {
        logger.error('Error checking reminders:', error);
      }
    }, 60000); // Check every minute
  },
} satisfies Event;
