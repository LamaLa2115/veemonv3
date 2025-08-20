import { readdirSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { BleedClient } from '../structures/Client';
import { Event } from '../types/index';
import { logger } from '../utils/logger';

export async function loadEvents(client: BleedClient): Promise<void> {
  const eventsPath = resolve(process.cwd(), 'src', 'events');
  const eventFiles = readdirSync(eventsPath).filter(file => 
    file.endsWith('.ts') || file.endsWith('.js')
  );
  
  let loadedEvents = 0;
  
  for (const file of eventFiles) {
    try {
      const filePath = join(eventsPath, file);
      const fileUrl = pathToFileURL(filePath).href;
      const eventModule = await import(fileUrl);
      const event: Event = eventModule.default || eventModule.event;
      
      if (event && event.name && event.execute) {
        if (event.once) {
          client.once(event.name, event.execute);
        } else {
          client.on(event.name, event.execute);
        }
        
        logger.debug(`Loaded event: ${event.name}`);
        loadedEvents++;
      } else {
        logger.warn(`Invalid event file: ${file}`);
      }
    } catch (error) {
      logger.error(`Error loading event ${file}:`, error);
    }
  }
  
  logger.info(`Loaded ${loadedEvents} events`);
}
