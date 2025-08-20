import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('poll')
    .setDescription('Create a poll')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('The poll question')
        .setRequired(true)
    ),
  permissions: [PermissionFlagsBits.ManageMessages],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const question = interaction.options.getString('question', true);

    const embed = new EmbedBuilder()
      .setTitle('**Poll**')
      .setDescription(question)
      .setAuthor({
        name: `Poll created by: ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(config.colors.primary)
      .setTimestamp()
      .setFooter({ text: interaction.client.user?.username || 'Bot' });

    const message = await interaction.reply({ embeds: [embed], fetchReply: true });
    
    try {
      await message.react('👍');
      await message.react('👎');
    } catch (error) {
      // Reactions failed, but poll was still created
    }
  },
} satisfies Command;
