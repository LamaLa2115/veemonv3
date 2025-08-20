import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const configSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  GUILD_ID: z.string().optional(),
  OWNER_ID: z.string().min(1),
  DEFAULT_PREFIX: z.string().default(',,'),
  JOIN_TO_CREATE_CHANNEL_ID: z.string().optional(),
  LASTFM_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

const env = configSchema.parse(process.env);

export const config = {
  discord: {
    token: env.DISCORD_TOKEN,
    clientId: env.CLIENT_ID,
    guildId: env.GUILD_ID,
    ownerId: env.OWNER_ID,
  },
  bot: {
    defaultPrefix: env.DEFAULT_PREFIX,
    joinToCreateChannelId: env.JOIN_TO_CREATE_CHANNEL_ID,
  },
  apis: {
    lastfm: env.LASTFM_API_KEY,
  },
  colors: {
    primary: 0x95a5a6,
    success: 0xa3eb7b,
    warning: 0xefa23a,
    error: 0xfe6464,
    info: 0x6495ED,
  },
  emojis: {
    approve: '<:approve:868562133850394675>',
    warn: '<:warn:868562165777444944>',
    deny: '<:deny:868562165093777468>',
    add: '<:add:868562133250609212>',
    remove: '<:remove:868562134236299326>',
  },
  environment: env.NODE_ENV,
} as const;

export type Config = typeof config;
