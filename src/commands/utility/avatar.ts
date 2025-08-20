import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Show a user\'s avatar')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user whose avatar to show (defaults to you)')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle(`${targetUser.username}'s avatar`)
      .setURL(targetUser.displayAvatarURL({ size: 2048 }))
      .setImage(targetUser.displayAvatarURL({ size: 2048 }))
      .setColor(config.colors.primary);

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
