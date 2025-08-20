import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('userbanner')
    .setDescription('Show a user\'s banner')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose banner to show (defaults to you)')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    
    await interaction.deferReply();

    try {
      // Fetch user with banner
      const user = await interaction.client.rest.get(`/users/${targetUser.id}`) as any;
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(`${targetUser.username}'s banner`)
        .setColor(config.colors.primary);

      if (user.banner) {
        const bannerUrl = `https://cdn.discordapp.com/banners/${targetUser.id}/${user.banner}.${user.banner.startsWith('a_') ? 'gif' : 'png'}?size=1024`;
        embed.setImage(bannerUrl);
        embed.setURL(bannerUrl);
      } else {
        embed.setDescription('This user doesn\'t have a banner set.');
      }

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to fetch user banner.`,
      });
    }
  },
} satisfies Command;
