import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('math')
    .setDescription('Perform mathematical calculations')
    .addStringOption(option =>
      option.setName('expression')
        .setDescription('Mathematical expression to calculate (e.g., 2+2, sqrt(16), sin(30))')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const expression = interaction.options.getString('expression', true);
    
    try {
      // Sanitize the expression to prevent code injection
      const sanitizedExpression = expression
        .replace(/[^0-9+\-*/().,\s]/g, '')
        .replace(/\s+/g, '');
      
      // Basic validation
      if (!sanitizedExpression || sanitizedExpression.length === 0) {
        await interaction.reply({
          content: `${config.emojis.warn} Please provide a valid mathematical expression using numbers and basic operators (+, -, *, /, (), .).`,
          ephemeral: true,
        });
        return;
      }
      
      // Check for balanced parentheses
      let parenthesesCount = 0;
      for (const char of sanitizedExpression) {
        if (char === '(') parenthesesCount++;
        if (char === ')') parenthesesCount--;
        if (parenthesesCount < 0) break;
      }
      
      if (parenthesesCount !== 0) {
        await interaction.reply({
          content: `${config.emojis.warn} Unbalanced parentheses in the expression.`,
          ephemeral: true,
        });
        return;
      }
      
      // Evaluate the expression using Function constructor (safer than eval)
      const result = Function(`"use strict"; return (${sanitizedExpression})`)();
      
      // Check if result is valid
      if (typeof result !== 'number' || !isFinite(result)) {
        await interaction.reply({
          content: `${config.emojis.warn} Invalid mathematical expression or result.`,
          ephemeral: true,
        });
        return;
      }
      
      // Format the result
      let formattedResult;
      if (Number.isInteger(result)) {
        formattedResult = result.toString();
      } else {
        formattedResult = parseFloat(result.toFixed(10)).toString();
      }
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle('🧮 Math Calculator')
        .addFields(
          { name: 'Expression', value: `\`${expression}\``, inline: false },
          { name: 'Result', value: `**${formattedResult}**`, inline: false }
        )
        .setColor(config.colors.success)
        .setTimestamp()
        .setFooter({
          text: 'Calculation completed',
        });
      
      // Add additional info for interesting results
      if (Math.abs(result) > 1000000) {
        embed.addFields({
          name: 'Scientific Notation',
          value: result.toExponential(3),
          inline: true
        });
      }
      
      if (result % 1 !== 0 && Math.abs(result) < 1000) {
        // Try to find a fraction representation for small decimals
        const fraction = approximateFraction(result);
        if (fraction) {
          embed.addFields({
            name: 'Approximate Fraction',
            value: fraction,
            inline: true
          });
        }
      }
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.deny} Error calculating the expression. Please check your syntax and try again.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;

// Helper function to approximate decimal as fraction
function approximateFraction(decimal: number, maxDenominator: number = 100): string | null {
  for (let denominator = 2; denominator <= maxDenominator; denominator++) {
    const numerator = Math.round(decimal * denominator);
    if (Math.abs(numerator / denominator - decimal) < 0.001) {
      // Simplify the fraction
      const gcd = greatestCommonDivisor(Math.abs(numerator), denominator);
      return `${numerator / gcd}/${denominator / gcd}`;
    }
  }
  return null;
}

function greatestCommonDivisor(a: number, b: number): number {
  return b === 0 ? a : greatestCommonDivisor(b, a % b);
}