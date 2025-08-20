import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, codeBlock } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import util from 'util';

export default {
  data: new SlashCommandBuilder()
    .setName('eval')
    .setDescription('Evaluate JavaScript code (Owner only)')
    .addStringOption(option =>
      option.setName('code')
        .setDescription('The code to evaluate')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const code = interaction.options.getString('code', true);

    try {
      let evaled = eval(code);

      if (typeof evaled !== 'string') {
        evaled = util.inspect(evaled, { depth: 0 });
      }

      // Clean sensitive information
      const clean = (text: string) => {
        if (typeof text === 'string') {
          return text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
            .replace(new RegExp(config.discord.token, 'gi'), '[TOKEN]');
        }
        return text;
      };

      const cleanedResult = clean(evaled);
      
      if (cleanedResult.length > 1990) {
        await interaction.reply({
          content: 'Output too long, check console.',
          ephemeral: true,
        });
        console.log(cleanedResult);
      } else {
        await interaction.reply({
          content: codeBlock('js', cleanedResult),
          ephemeral: true,
        });
      }
    } catch (err) {
      const error = err as Error;
      await interaction.reply({
        content: `\`ERROR\` ${codeBlock('xl', error.message)}`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
