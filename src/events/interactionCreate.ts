import { Events, ChatInputCommandInteraction, StringSelectMenuInteraction, ButtonInteraction } from 'discord.js';
import { Event, ExtendedClient } from '../types/index';
import { logger } from '../utils/logger';
import { config } from '../config/config';
import { db } from '../utils/database';

export default {
  name: Events.InteractionCreate,
  async execute(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ButtonInteraction) {
    
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const client = interaction.client as ExtendedClient;
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        logger.warn(`Unknown command: ${interaction.commandName}`);
        return;
      }

      // Check if command is owner only
      if (command.ownerOnly && interaction.user.id !== config.discord.ownerId) {
        await interaction.reply({
          content: `${config.emojis.deny} This command is restricted to the bot owner.`,
          ephemeral: true,
        });
        return;
      }

      // Check if command requires guild
      if (command.guildOnly && !interaction.guild) {
        await interaction.reply({
          content: `${config.emojis.warn} This command can only be used in a server.`,
          ephemeral: true,
        });
        return;
      }

      // Check permissions (owner bypass)
      if (command.permissions && interaction.guild && interaction.user.id !== config.discord.ownerId) {
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const hasPermissions = command.permissions.every(permission =>
          member.permissions.has(permission)
        );

        if (!hasPermissions) {
          await interaction.reply({
            content: `${config.emojis.warn} You don't have the required permissions to use this command.`,
            ephemeral: true,
          });
          return;
        }
      }

      // Check cooldowns
      if (command.cooldown) {
        const cooldowns = client.cooldowns;
        const commandName = command.data.name;
        const userId = interaction.user.id;

        if (!cooldowns.has(commandName)) {
          cooldowns.set(commandName, new Map());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(commandName)!;
        const cooldownAmount = command.cooldown * 1000;

        if (timestamps.has(userId)) {
          const expirationTime = timestamps.get(userId)! + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            await interaction.reply({
              content: `${config.emojis.warn} Please wait ${timeLeft.toFixed(1)} seconds before using this command again.`,
              ephemeral: true,
            });
            return;
          }
        }

        timestamps.set(userId, now);
        setTimeout(() => timestamps.delete(userId), cooldownAmount);
      }

      try {
        await command.execute(interaction);
        logger.debug(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
      } catch (error) {
        logger.error(`Error executing command ${interaction.commandName}:`, error);
        
        const errorMessage = {
          content: `${config.emojis.deny} An error occurred while executing this command.`,
          flags: 64, // Use flags instead of ephemeral
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'portal_server_select') {
        await handlePortalServerSelect(interaction);
      }
    }

    // Handle button interactions
    else if (interaction.isButton()) {
      if (interaction.customId.startsWith('vm_')) {
        await handleVoicemasterButton(interaction);
      } else if (interaction.customId.startsWith('vc_')) {
        await handleUniversalVCButton(interaction);
      }
    }
  },
} satisfies Event;

async function handlePortalServerSelect(interaction: StringSelectMenuInteraction) {
  if (interaction.user.id !== config.discord.ownerId) {
    await interaction.reply({
      content: `${config.emojis.deny} Only the bot owner can use portal invites.`,
      ephemeral: true,
    });
    return;
  }

  const guildId = interaction.values[0];
  const guild = interaction.client.guilds.cache.get(guildId);

  if (!guild) {
    await interaction.reply({
      content: `${config.emojis.deny} Server not found or bot is no longer in that server.`,
      ephemeral: true,
    });
    return;
  }

  try {
    // Find a suitable channel to create invite
    const inviteChannel = guild.channels.cache
      .filter(ch => ch.type === 0 && ch.permissionsFor(guild.members.me!)?.has('CreateInstantInvite'))
      .first();

    if (!inviteChannel) {
      await interaction.reply({
        content: `${config.emojis.deny} Cannot create invite for **${guild.name}** - no suitable channels found.`,
        ephemeral: true,
      });
      return;
    }

    const invite = await inviteChannel.createInvite({
      maxAge: 86400, // 24 hours
      maxUses: 1,
      unique: true,
      reason: 'Portal invite created by bot owner'
    });

    const embed = {
      title: '🌐 Portal Invite Created',
      description: `Successfully created invite for **${guild.name}**`,
      fields: [
        { name: 'Server', value: guild.name, inline: true },
        { name: 'Members', value: guild.memberCount?.toString() || 'Unknown', inline: true },
        { name: 'Channel', value: `#${inviteChannel.name}`, inline: true },
        { name: 'Expires', value: '<t:' + Math.floor((Date.now() + 86400000) / 1000) + ':R>', inline: true },
        { name: 'Max Uses', value: '1', inline: true },
        { name: 'Invite Link', value: `[Join Server](${invite.url})`, inline: false }
      ],
      color: config.colors.success,
      timestamp: new Date().toISOString()
    };

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

  } catch (error) {
    logger.error('Portal invite creation error:', error);
    await interaction.reply({
      content: `${config.emojis.deny} Failed to create invite for **${guild.name}**.`,
      ephemeral: true,
    });
  }
}

async function handleVoicemasterButton(interaction: ButtonInteraction) {
  const customId = interaction.customId;
  const [action, , channelId] = customId.split('_');
  
  try {
    // Get channel data from database
    const tempChannel = await db.getVoiceChannel(channelId);
    if (!tempChannel) {
      await interaction.reply({
        content: '❌ This voicemaster channel no longer exists.',
        flags: 64
      });
      return;
    }

    // Check if user is the owner
    if (interaction.user.id !== tempChannel.ownerId) {
      await interaction.reply({
        content: '❌ Only the channel owner can use these controls.',
        flags: 64
      });
      return;
    }

    const channel = interaction.guild?.channels.cache.get(channelId);
    if (!channel || channel.type !== 2) { // 2 = GuildVoice
      await interaction.reply({
        content: '❌ Voice channel not found.',
        flags: 64
      });
      return;
    }

    // Handle different actions
    switch (action) {
      case 'lock':
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          Connect: false
        });
        await interaction.reply({
          content: '🔒 Voice channel locked! Only current members can join.',
          flags: 64
        });
        break;

      case 'unlock':
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          Connect: true
        });
        await interaction.reply({
          content: '🔓 Voice channel unlocked! Anyone can join.',
          flags: 64
        });
        break;

      case 'delete':
        await channel.delete('Voice channel deleted by owner');
        await db.deleteVoiceChannel(channelId);
        await interaction.reply({
          content: '🗑️ Voice channel deleted successfully.',
          flags: 64
        });
        break;

      case 'info':
        const memberCount = channel.members.size;
        const userLimit = channel.userLimit || 'No limit';
        const isLocked = !channel.permissionsFor(interaction.guild!.roles.everyone)?.has('Connect');
        
        await interaction.reply({
          content: `ℹ️ **Channel Info:**\n` +
                  `👥 Members: ${memberCount}\n` +
                  `🎯 Limit: ${userLimit}\n` +
                  `🔒 Status: ${isLocked ? 'Locked' : 'Unlocked'}\n` +
                  `👑 Owner: <@${tempChannel.ownerId}>`,
          flags: 64
        });
        break;

      default:
        await interaction.reply({
          content: `🔧 "${action}" control is being developed.`,
          flags: 64
        });
    }

  } catch (error) {
    logger.error('Voicemaster button error:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your request.',
      flags: 64
    });
  }
}

async function handleUniversalVCButton(interaction: ButtonInteraction) {
  const action = interaction.customId.replace('vc_', '');
  
  try {
    // Check if user is in a voice channel
    if (!interaction.member?.voice?.channel) {
      await interaction.reply({
        content: '❌ You must be in a voice channel to use these controls.',
        flags: 64
      });
      return;
    }

    const userVoiceChannel = interaction.member.voice.channel;
    
    // Check if this is a temporary voice channel they own
    const tempChannel = await db.getVoiceChannel(userVoiceChannel.id);
    if (!tempChannel || tempChannel.ownerId !== interaction.user.id) {
      await interaction.reply({
        content: '❌ You can only control temporary voice channels that you own.',
        flags: 64
      });
      return;
    }

    const channel = userVoiceChannel;

    // Handle different actions
    switch (action) {
      case 'lock':
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          Connect: false
        });
        await interaction.reply({
          content: '🔒 Your voice channel has been locked!',
          flags: 64
        });
        break;

      case 'unlock':
        await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
          Connect: true
        });
        await interaction.reply({
          content: '🔓 Your voice channel has been unlocked!',
          flags: 64
        });
        break;

      case 'delete':
        await channel.delete('Voice channel deleted by owner via control panel');
        await db.deleteVoiceChannel(channel.id);
        await interaction.reply({
          content: '🗑️ Your voice channel has been deleted.',
          flags: 64
        });
        break;

      case 'info':
        const memberCount = channel.members.size;
        const userLimit = channel.userLimit || 'No limit';
        const isLocked = !channel.permissionsFor(interaction.guild!.roles.everyone)?.has('Connect');
        
        await interaction.reply({
          content: `ℹ️ **Your Channel Info:**\n` +
                  `📝 Name: ${channel.name}\n` +
                  `👥 Members: ${memberCount}\n` +
                  `🎯 Limit: ${userLimit}\n` +
                  `🔒 Status: ${isLocked ? 'Locked' : 'Unlocked'}`,
          flags: 64
        });
        break;

      default:
        await interaction.reply({
          content: `🔧 "${action}" control is being developed. Coming soon!`,
          flags: 64
        });
    }

  } catch (error) {
    logger.error('Universal VC button error:', error);
    await interaction.reply({
      content: '❌ An error occurred while processing your request.',
      flags: 64
    });
  }
}