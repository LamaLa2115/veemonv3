import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guildbanner')
    .setDescription('Show the server banner'),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const bannerUrl = interaction.guild.bannerURL({ size: 2048 });
    
    if (!bannerUrl) {
      await interaction.reply({
        content: `${config.emojis.warn} This server doesn't have a banner set.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name}'s banner`)
      .setImage(bannerUrl)
      .setColor(config.colors.primary);

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
