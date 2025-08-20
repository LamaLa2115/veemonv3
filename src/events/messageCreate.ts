import { Events, Message } from 'discord.js';
import { Event, ExtendedClient } from '../types/index';
import { logger } from '../utils/logger';
import { db } from '../utils/database';
import { config } from '../config/config';

export default {
  name: Events.MessageCreate,
  async execute(message: Message) {
    if (message.author.bot || !message.guild) return;

    const client = message.client as ExtendedClient;
    
    // Get guild prefix from database
    let guildPrefix = await db.getGuildPrefix(message.guild.id);
    if (!guildPrefix) {
      // Create guild entry with default prefix
      await db.createGuild(message.guild.id, ',');
      guildPrefix = ',';
    }

    // Check if message starts with prefix
    if (!message.content.startsWith(guildPrefix)) return;

    const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) return;

    // Find command (check aliases too)
    const command = client.commands.get(commandName) || 
      client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // Check if command is owner only
    if (command.ownerOnly && message.author.id !== config.discord.ownerId) {
      await message.reply(`${config.emojis.deny} This command is restricted to the bot owner.`);
      return;
    }

    // Check if command requires guild
    if (command.guildOnly && !message.guild) {
      await message.reply(`${config.emojis.warn} This command can only be used in a server.`);
      return;
    }

    // Check permissions (owner bypass)
    if (command.permissions && message.guild && message.author.id !== config.discord.ownerId) {
      const member = await message.guild.members.fetch(message.author.id);
      const hasPermissions = command.permissions.every(permission =>
        member.permissions.has(permission)
      );

      if (!hasPermissions) {
        await message.reply(`${config.emojis.warn} You don't have the required permissions to use this command.`);
        return;
      }
    }

    // Check cooldowns
    if (command.cooldown) {
      const cooldowns = client.cooldowns;
      const commandKey = command.data.name;
      const userId = message.author.id;

      if (!cooldowns.has(commandKey)) {
        cooldowns.set(commandKey, new Map());
      }

      const now = Date.now();
      const timestamps = cooldowns.get(commandKey)!;
      const cooldownAmount = command.cooldown * 1000;

      if (timestamps.has(userId)) {
        const expirationTime = timestamps.get(userId)! + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;
          await message.reply(`${config.emojis.warn} Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`);
          return;
        }
      }

      timestamps.set(userId, now);
      setTimeout(() => timestamps.delete(userId), cooldownAmount);
    }

    try {
      // Create a mock interaction for prefix commands
      const mockInteraction = {
        ...message,
        reply: message.reply.bind(message),
        followUp: message.reply.bind(message),
        editReply: (content: any) => message.edit(content),
        deferReply: () => Promise.resolve(),
        user: message.author,
        member: message.member,
        guild: message.guild,
        channel: message.channel,
        options: {
          getString: (name: string) => args[0] || null,
          getUser: (name: string) => message.mentions.users.first() || null,
          getMember: (name: string) => message.mentions.members?.first() || null,
          getChannel: (name: string) => message.mentions.channels.first() || null,
          getRole: (name: string) => message.mentions.roles.first() || null,
          getInteger: (name: string) => parseInt(args[0]) || null,
          getBoolean: (name: string) => args[0]?.toLowerCase() === 'true' || false,
          getSubcommand: () => args[0] || null,
          getSubcommandGroup: () => args[0] || null,
        },
        isCommand: () => true,
        isChatInputCommand: () => true,
        commandName: command.data.name,
        client: message.client,
      };

      await command.execute(mockInteraction as any);
      logger.debug(`Prefix command executed: ${commandName} by ${message.author.tag}`);
    } catch (error) {
      logger.error(`Error executing prefix command ${commandName}:`, error);
      await message.reply(`${config.emojis.deny} An error occurred while executing this command.`);
    }
  },
} satisfies Event;