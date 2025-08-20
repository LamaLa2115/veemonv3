import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('coin')
    .setDescription('Flip a coin and see if you get heads or tails'),
  async execute(interaction: ChatInputCommandInteraction) {
    const isHeads = Math.random() < 0.5;
    const result = isHeads ? 'Heads' : 'Tails';
    const emoji = isHeads ? '🪙' : '🥈';
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle('🪙 Coin Flip')
      .setDescription(`The coin landed on **${result}**! ${emoji}`)
      .setColor(isHeads ? 0xFFD700 : 0xC0C0C0) // Gold for heads, silver for tails
      .setThumbnail(isHeads 
        ? 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Coin_Flipping.png'
        : 'https://upload.wikimedia.org/wikipedia/commons/4/4d/Coin_Flipping.png'
      )
      .setTimestamp()
      .setFooter({
        text: `${isHeads ? 'Lucky!' : 'Better luck next time!'}`,
      });

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;