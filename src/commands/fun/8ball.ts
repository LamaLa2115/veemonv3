import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('8ball')
    .setDescription('Ask the magic 8-ball a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The question to ask the 8-ball')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);
    
    const responses = [
      // Positive
      "It is certain.",
      "It is decidedly so.",
      "Without a doubt.",
      "Yes definitely.",
      "You may rely on it.",
      "As I see it, yes.",
      "Most likely.",
      "Outlook good.",
      "Yes.",
      "Signs point to yes.",
      
      // Neutral/Uncertain
      "Reply hazy, try again.",
      "Ask again later.",
      "Better not tell you now.",
      "Cannot predict now.",
      "Concentrate and ask again.",
      
      // Negative
      "Don't count on it.",
      "My reply is no.",
      "My sources say no.",
      "Outlook not so good.",
      "Very doubtful."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Determine color based on response type
    let responseColor = config.colors.primary;
    if (randomResponse.includes('yes') || randomResponse.includes('certain') || randomResponse.includes('definitely') || randomResponse.includes('rely on it') || randomResponse.includes('most likely') || randomResponse.includes('good') || randomResponse.includes('point to yes')) {
      responseColor = config.colors.success;
    } else if (randomResponse.includes('no') || randomResponse.includes('don\'t') || randomResponse.includes('doubtful') || randomResponse.includes('not so good')) {
      responseColor = config.colors.error;
    } else {
      responseColor = config.colors.warning;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: '❓ Question', value: question, inline: false },
        { name: '🔮 Answer', value: `**${randomResponse}**`, inline: false }
      )
      .setColor(responseColor)
      .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/f/fd/8-Ball_Pool.svg')
      .setTimestamp()
      .setFooter({
        text: 'The magic 8-ball has spoken!',
      });

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;