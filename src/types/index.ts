import { 
  SlashCommandBuilder, 
  ChatInputCommandInteraction, 
  Client,
  PermissionResolvable
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  permissions?: PermissionResolvable[];
  ownerOnly?: boolean;
  guildOnly?: boolean;
  cooldown?: number;
}

export interface Event {
  name: string;
  once?: boolean;
  execute: (...args: any[]) => Promise<void>;
}

export interface ExtendedClient extends Client {
  commands: Map<string, Command>;
  cooldowns: Map<string, Map<string, number>>;
}

export interface SpotifyActivity {
  name: string;
  type: string;
  details?: string;
  state?: string;
  assets?: {
    largeImage?: string;
    largeText?: string;
  };
  timestamps?: {
    start?: number;
    end?: number;
  };
  syncID?: string;
}

export interface VoiceChannelData {
  channelId: string;
  ownerId: string;
  guildId: string;
  createdAt: Date;
}
