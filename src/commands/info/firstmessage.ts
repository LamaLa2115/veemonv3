import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('firstmessage')
    .setDescription('Get the first message in this channel'),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.channel || !('messages' in interaction.channel)) {
      await interaction.reply({
        content: `${config.emojis.warn} This command can only be used in text channels.`,
        ephemeral: true,
      });
      return;
    }

    await interaction.deferReply();

    try {
      const messages = await interaction.channel.messages.fetch({ 
        after: '0',
        limit: 1,
      });
      
      const firstMessage = messages.first();
      
      if (!firstMessage) {
        await interaction.editReply({
          content: `${config.emojis.warn} No messages found in this channel.`,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(`First Message in #${interaction.channel.name}`)
        .setColor(config.colors.primary)
        .setURL(firstMessage.url)
        .setThumbnail(firstMessage.author.displayAvatarURL())
        .setDescription(`**Content:** ${firstMessage.content || '*No content*'}`)
        .addFields(
          { name: '**Author**', value: firstMessage.author.toString(), inline: true },
          { name: '**Message ID**', value: firstMessage.id, inline: true },
          { name: '**Sent At**', value: firstMessage.createdAt.toLocaleDateString(), inline: true }
        );

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to fetch the first message.`,
      });
    }
  },
} satisfies Command;
