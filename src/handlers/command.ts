import { Collection } from 'discord.js';
import { readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { pathToFileURL } from 'url';
import { BleedClient } from '../structures/Client.js';
import { Command } from '../types/index.js';
import { logger } from '../utils/logger.js';

export async function loadCommands(client: BleedClient): Promise<void> {
  const commandsPath = resolve(process.cwd(), 'src', 'commands');
  
  async function loadCommandsFromDir(dir: string): Promise<void> {
    const items = readdirSync(dir);
    
    for (const item of items) {
      const itemPath = join(dir, item);
      const stat = statSync(itemPath);
      
      if (stat.isDirectory()) {
        await loadCommandsFromDir(itemPath);
      } else if (item.endsWith('.ts') || item.endsWith('.js')) {
        try {
          const fileUrl = pathToFileURL(itemPath).href;
          const commandModule = await import(fileUrl);
          const command: Command = commandModule.default || commandModule.command;
          
          if (command && command.data && command.execute) {
            client.commands.set(command.data.name, command);
            logger.debug(`Loaded command: ${command.data.name}`);
          } else {
            logger.warn(`Invalid command file: ${item}`);
          }
        } catch (error) {
          logger.error(`Error loading command ${item}:`, error);
        }
      }
    }
  }
  
  await loadCommandsFromDir(commandsPath);
  logger.info(`Loaded ${client.commands.size} commands`);
}
