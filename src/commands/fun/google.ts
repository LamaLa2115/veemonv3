import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('google')
    .setDescription('Create a Google search link')
    .addStringOption(option =>
      option.setName('query')
        .setDescription('What to search for')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const query = interaction.options.getString('query', true);
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(`Search Results for ${query}`)
      .setDescription(`[Click here to view Google search results](${searchUrl})`)
      .setColor(config.colors.primary)
      .setFooter({
        text: 'Google Search',
        iconURL: 'https://maxcdn.icons8.com/Share/icon/Logos//google_logo1600.png',
      });

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
