import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('quote')
    .setDescription('Get a random inspirational quote')
    .addStringOption(option =>
      option.setName('category')
        .setDescription('Category of quote to get')
        .setRequired(false)
        .addChoices(
          { name: 'Inspirational', value: 'inspirational' },
          { name: 'Motivational', value: 'motivational' },
          { name: 'Life', value: 'life' },
          { name: 'Success', value: 'success' },
          { name: 'Wisdom', value: 'wisdom' },
          { name: 'Random', value: 'random' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const category = interaction.options.getString('category') || 'random';
    
    await interaction.deferReply();

    try {
      // Using quotable.io API (free)
      let apiUrl = 'https://api.quotable.io/random';
      
      if (category !== 'random') {
        apiUrl += `?tags=${category}`;
      }

      const response = await axios.get(apiUrl);
      const quote = response.data;
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle('💭 Inspirational Quote')
        .setDescription(`*"${quote.content}"*`)
        .addFields(
          { name: '✍️ Author', value: quote.author, inline: true },
          { name: '🏷️ Category', value: quote.tags?.join(', ') || 'General', inline: true },
          { name: '📏 Length', value: `${quote.length} characters`, inline: true }
        )
        .setColor(config.colors.info)
        .setTimestamp()
        .setFooter({
          text: 'Quotes from Quotable.io',
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      // Fallback quotes if API fails
      const fallbackQuotes = [
        { content: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
        { content: "The pessimist sees difficulty in every opportunity. The optimist sees opportunity in every difficulty.", author: "Winston Churchill" },
        { content: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
        { content: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown" },
        { content: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" }
      ];

      const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle('💭 Inspirational Quote')
        .setDescription(`*"${randomQuote.content}"*`)
        .addFields(
          { name: '✍️ Author', value: randomQuote.author, inline: true }
        )
        .setColor(config.colors.info)
        .setTimestamp()
        .setFooter({
          text: 'Fallback quote collection',
        });

      await interaction.editReply({ embeds: [embed] });
    }
  },
} satisfies Command;