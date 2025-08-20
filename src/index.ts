import { BleedClient } from './structures/Client';
import { logger } from './utils/logger';

const client = new BleedClient();

// Handle process events
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await client.shutdown();
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await client.shutdown();
});

// Start the bot
client.start().catch((error) => {
  logger.error('Failed to start bot:', error);
  process.exit(1);
});
