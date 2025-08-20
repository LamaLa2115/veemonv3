import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('dice')
    .setDescription('Roll dice with customizable sides and quantity')
    .addIntegerOption(option =>
      option.setName('sides')
        .setDescription('Number of sides on the dice (default: 6)')
        .setMinValue(2)
        .setMaxValue(100)
        .setRequired(false)
    )
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of dice to roll (default: 1)')
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const sides = interaction.options.getInteger('sides') || 6;
    const count = interaction.options.getInteger('count') || 1;
    
    const rolls: number[] = [];
    let total = 0;
    
    for (let i = 0; i < count; i++) {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls.push(roll);
      total += roll;
    }
    
    const average = (total / count).toFixed(1);
    const diceEmoji = sides === 6 ? '🎲' : '🔢';
    
    // Determine result color based on how good the roll was
    let resultColor = config.colors.primary;
    if (count === 1) {
      if (rolls[0] === sides) resultColor = config.colors.success; // Max roll
      else if (rolls[0] === 1) resultColor = config.colors.error; // Min roll
      else if (rolls[0] >= sides * 0.8) resultColor = config.colors.info; // Good roll
    } else {
      const maxPossible = sides * count;
      const rollPercentage = total / maxPossible;
      if (rollPercentage >= 0.8) resultColor = config.colors.success;
      else if (rollPercentage <= 0.2) resultColor = config.colors.error;
      else if (rollPercentage >= 0.6) resultColor = config.colors.info;
    }
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(`${diceEmoji} Dice Roll`)
      .setColor(resultColor)
      .setTimestamp();
    
    if (count === 1) {
      embed.setDescription(`You rolled a **${rolls[0]}** on a ${sides}-sided die!`);
      
      if (rolls[0] === sides) {
        embed.setFooter({ text: 'Critical success! 🎉' });
      } else if (rolls[0] === 1) {
        embed.setFooter({ text: 'Critical failure! 💥' });
      } else if (rolls[0] >= sides * 0.8) {
        embed.setFooter({ text: 'Great roll! 🌟' });
      }
    } else {
      const rollsDisplay = rolls.map((roll, index) => `Die ${index + 1}: **${roll}**`).join('\n');
      
      embed.addFields(
        { name: `${count}x d${sides} Results`, value: rollsDisplay, inline: true },
        { name: 'Statistics', value: `**Total:** ${total}\n**Average:** ${average}`, inline: true }
      );
      
      embed.setDescription(`You rolled ${count} dice with ${sides} sides each!`);
      
      const maxPossible = sides * count;
      const rollPercentage = (total / maxPossible * 100).toFixed(1);
      embed.setFooter({ text: `${rollPercentage}% of maximum possible (${maxPossible})` });
    }
    
    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;