import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('servers')
    .setDescription('View and manage servers the bot is in (Owner only)'),
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const guilds = client.guilds.cache;
    
    if (guilds.size === 0) {
      await interaction.reply({
        content: `${config.emojis.warn} Bot is not in any servers.`,
        ephemeral: true,
      });
      return;
    }
    
    // Create pages for servers (25 per page due to embed field limit)
    const guildsArray = Array.from(guilds.values());
    const pageSize = 10;
    const pages = [];
    
    for (let i = 0; i < guildsArray.length; i += pageSize) {
      const pageGuilds = guildsArray.slice(i, i + pageSize);
      
      const embed = new EmbedBuilder()
        .setTitle('🌐 Bot Servers')
        .setDescription(`Showing servers ${i + 1}-${Math.min(i + pageSize, guildsArray.length)} of ${guildsArray.length}`)
        .setColor(config.colors.primary)
        .setTimestamp()
        .setFooter({
          text: `Page ${Math.floor(i / pageSize) + 1}/${Math.ceil(guildsArray.length / pageSize)}`,
          iconURL: client.user?.displayAvatarURL(),
        });
      
      pageGuilds.forEach((guild, index) => {
        const owner = guild.members.cache.get(guild.ownerId);
        const memberCount = guild.memberCount;
        const createdAt = Math.floor(guild.createdTimestamp / 1000);
        
        embed.addFields({
          name: `${i + index + 1}. ${guild.name}`,
          value: [
            `**ID:** ${guild.id}`,
            `**Owner:** ${owner?.user.tag || 'Unknown'} (${guild.ownerId})`,
            `**Members:** ${memberCount}`,
            `**Created:** <t:${createdAt}:R>`,
            `**Joined:** <t:${Math.floor((guild.joinedTimestamp || 0) / 1000)}:R>`
          ].join('\n'),
          inline: false
        });
      });
      
      pages.push(embed);
    }
    
    // Create server selection menu
    const serverOptions = guildsArray.slice(0, 25).map(guild => ({
      label: guild.name.length > 50 ? guild.name.substring(0, 47) + '...' : guild.name,
      value: guild.id,
      description: `${guild.memberCount} members | ID: ${guild.id}`,
      emoji: '🏠'
    }));
    
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('server_select')
      .setPlaceholder('Select a server to get an invite link')
      .addOptions(serverOptions);
    
    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);
    
    let currentPage = 0;
    const response = await interaction.reply({
      embeds: [pages[currentPage]],
      components: guildsArray.length <= 25 ? [row] : [],
      ephemeral: true,
    });
    
    // Handle select menu interactions
    if (guildsArray.length <= 25) {
      const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000, // 5 minutes
      });
      
      collector.on('collect', async (selectInteraction) => {
        if (selectInteraction.user.id !== interaction.user.id) {
          await selectInteraction.reply({
            content: 'This menu can only be used by the bot owner.',
            ephemeral: true,
          });
          return;
        }
        
        const guildId = selectInteraction.values[0];
        const guild = client.guilds.cache.get(guildId);
        
        if (!guild) {
          await selectInteraction.reply({
            content: `${config.emojis.warn} Guild not found or bot is no longer in that server.`,
            ephemeral: true,
          });
          return;
        }
        
        try {
          // Try to create an invite from the system channel or first available channel
          let channel = guild.systemChannel;
          if (!channel) {
            channel = guild.channels.cache
              .filter(c => c.type === 0 && c.permissionsFor(guild.members.me!)?.has('CreateInstantInvite'))
              .first() as any;
          }
          
          if (!channel) {
            await selectInteraction.reply({
              content: `${config.emojis.deny} Cannot create invite for **${guild.name}** - no suitable channel found or missing permissions.`,
              ephemeral: true,
            });
            return;
          }
          
          const invite = await channel.createInvite({
            maxAge: 3600, // 1 hour
            maxUses: 1,
            unique: true,
            reason: 'Owner portal access'
          });
          
          const inviteEmbed = new EmbedBuilder()
            .setTitle(`🚪 Server Portal: ${guild.name}`)
            .setDescription(`Click the link below to join **${guild.name}**`)
            .addFields(
              { name: 'Invite Link', value: `[Join Server](${invite.url})`, inline: true },
              { name: 'Expires', value: '<t:' + Math.floor((Date.now() + 3600000) / 1000) + ':R>', inline: true },
              { name: 'Server Info', value: `${guild.memberCount} members\nOwned by <@${guild.ownerId}>`, inline: false }
            )
            .setThumbnail(guild.iconURL() || null)
            .setColor(config.colors.success)
            .setTimestamp();
          
          await selectInteraction.reply({
            embeds: [inviteEmbed],
            ephemeral: true,
          });
          
        } catch (error) {
          await selectInteraction.reply({
            content: `${config.emojis.deny} Failed to create invite for **${guild.name}** - missing permissions.`,
            ephemeral: true,
          });
        }
      });
      
      collector.on('end', async () => {
        try {
          await response.edit({ components: [] });
        } catch {
          // Message may have been deleted
        }
      });
    }
  },
} satisfies Command;