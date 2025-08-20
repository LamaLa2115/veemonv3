import { Client } from 'discord.js';
import { db } from '../utils/database';
import { logger } from '../utils/logger';
import { config } from '../config/config';

export async function checkReminders(client: Client): Promise<void> {
  try {
    const expiredReminders = await db.getExpiredReminders();
    
    for (const reminder of expiredReminders) {
      try {
        const user = await client.users.fetch(reminder.userId);
        
        await user.send({
          embeds: [{
            color: config.colors.info,
            description: `🔔 You wanted me to remind you: **${reminder.message}**`,
            timestamp: new Date().toISOString(),
          }],
        });
        
        await db.deleteReminder(reminder.id);
        logger.debug(`Sent reminder to ${user.tag}`);
      } catch (error) {
        logger.error(`Failed to send reminder ${reminder.id}:`, error);
        // Delete failed reminder after 24 hours
        if (Date.now() - reminder.remindAt.getTime() > 24 * 60 * 60 * 1000) {
          await db.deleteReminder(reminder.id);
        }
      }
    }
  } catch (error) {
    logger.error('Error checking reminders:', error);
  }
}
