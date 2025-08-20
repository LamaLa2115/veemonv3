import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('appstore')
    .setDescription('Search for an app on the App Store')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('The app to search for')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query', true);
    
    await interaction.deferReply();

    try {
      const response = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&country=us&entity=software&limit=1`);
      const data = response.data;

      if (!data.results || data.results.length === 0) {
        await interaction.editReply({
          content: `${config.emojis.warn} No apps found for **${query}**.`,
        });
        return;
      }

      const app = data.results[0];
      const description = app.description.length > 200 ? `${app.description.slice(0, 200)}...` : app.description;
      const price = app.price === 0 ? 'Free' : `$${app.price}`;
      const rating = app.averageUserRating?.toFixed(1) || 'No rating';

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(`**${app.trackName}**`)
        .setThumbnail(app.artworkUrl512 || app.artworkUrl100)
        .setURL(app.trackViewUrl)
        .setDescription(description)
        .addFields(
          { name: '**Price**', value: price, inline: true },
          { name: '**Developer**', value: app.artistName, inline: true },
          { name: '**Rating**', value: rating, inline: true }
        )
        .setColor(config.colors.primary)
        .setTimestamp()
        .setFooter({
          text: 'App Store Results',
          iconURL: 'https://cdn4.iconfinder.com/data/icons/miu-black-social-2/60/app_store-512.png',
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to search the App Store.`,
      });
    }
  },
} satisfies Command;
