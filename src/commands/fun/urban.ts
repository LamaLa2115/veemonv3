import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('urban')
    .setDescription('Get a definition from Urban Dictionary')
    .addStringOption(option =>
      option.setName('term')
        .setDescription('The term to define')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const term = interaction.options.getString('term', true);
    
    await interaction.deferReply();

    try {
      const response = await axios.get(`http://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}`);
      const data = response.data;

      if (!data.list || data.list.length === 0) {
        await interaction.editReply({
          content: `${config.emojis.warn} No definitions found for **${term}**.`,
        });
        return;
      }

      const definition = data.list[0];
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(`**${definition.word}**`)
        .setURL(definition.permalink || 'https://www.urbandictionary.com/')
        .setDescription(`${definition.definition.slice(0, 2000)}\n\n**Example**\n${definition.example?.slice(0, 1000) || 'No example'}`)
        .addFields({
          name: '**Votes**',
          value: `👍 \`${definition.thumbs_up} / ${definition.thumbs_down}\` 👎`,
        })
        .setColor(config.colors.primary)
        .setTimestamp()
        .setFooter({
          text: 'Urban Dictionary Results',
          iconURL: 'https://images-ext-1.discordapp.net/external/8j3tp5o_0hOhrVP_IWHZJcnpmsZ4hdEaNcyEeRCp8TQ/%3Fcache-bust-this-di/https/cdn.notsobot.com/brands/urban-dictionary.png',
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to fetch definition from Urban Dictionary.`,
      });
    }
  },
} satisfies Command;
