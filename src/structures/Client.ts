import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  ActivityType,
} from 'discord.js';
import { Command, ExtendedClient } from '../types/index';
import { logger } from '../utils/logger';
import { db } from '../utils/database';
import { config } from '../config/config';

export class BleedClient extends Client implements ExtendedClient {
  public commands: Collection<string, Command>;
  public cooldowns: Collection<string, Collection<string, number>>;

  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User,
      ],
      presence: {
        status: 'online',
        activities: [
          {
            name: 'with Discord.js v14',
            type: ActivityType.Playing,
          },
        ],
      },
    });

    this.commands = new Collection();
    this.cooldowns = new Collection();
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await db.connect();

      // Load handlers
      const { loadCommands } = await import('../handlers/command');
      const { loadEvents } = await import('../handlers/event');

      await loadCommands(this);
      await loadEvents(this);

      // Login to Discord
      await this.login(config.discord.token);

      logger.info('Bot successfully started!');
    } catch (error) {
      logger.error('Failed to start bot:', error);
      process.exit(1);
    }
  }

  public async shutdown(): Promise<void> {
    logger.info('Shutting down bot...');
    
    // Disconnect from database
    await db.disconnect();
    
    // Destroy client
    this.destroy();
    
    logger.info('Bot shutdown complete');
    process.exit(0);
  }
}
