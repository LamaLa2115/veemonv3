import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('guildicon')
    .setDescription('Show the server icon'),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const iconUrl = interaction.guild.iconURL({ size: 2048 });
    
    if (!iconUrl) {
      await interaction.reply({
        content: `${config.emojis.warn} This server doesn't have an icon set.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`${interaction.guild.name}'s icon`)
      .setImage(iconUrl)
      .setColor(config.colors.primary);

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
