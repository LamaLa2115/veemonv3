import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('portal')
    .setDescription('Create invite links to servers the bot is in (Owner only)'),
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const client = interaction.client;
      const guilds = client.guilds.cache;

      if (guilds.size === 0) {
        await interaction.editReply({
          content: `${config.emojis.warn} The bot is not in any servers.`
        });
        return;
      }

      // Create server list for selection
      const serverOptions = guilds
        .filter(guild => guild.id !== interaction.guild?.id) // Exclude current server
        .map(guild => ({
          label: guild.name.slice(0, 100), // Discord limit
          description: `${guild.memberCount} members • ID: ${guild.id}`,
          value: guild.id
        }))
        .slice(0, 25); // Discord select menu limit

      if (serverOptions.length === 0) {
        await interaction.editReply({
          content: `${config.emojis.warn} No other servers available for portals.`
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle('🌐 Server Portal System')
        .setDescription('Select a server to generate an invite link')
        .addFields(
          { name: 'Available Servers', value: `${serverOptions.length} servers`, inline: true },
          { name: 'Total Servers', value: `${guilds.size} servers`, inline: true },
          { name: 'Portal Access', value: 'Owner Only', inline: true }
        )
        .setColor(config.colors.primary)
        .setTimestamp();

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('portal_server_select')
        .setPlaceholder('Choose a server to create portal invite...')
        .addOptions(serverOptions);

      const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

      await interaction.editReply({
        embeds: [embed],
        components: [row]
      });

    } catch (error) {
      console.error('Portal command error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to load server portal system.`
      });
    }
  },
} satisfies Command;