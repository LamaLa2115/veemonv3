import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';
import { parse } from 'twemoji-parser';

export default {
  data: new SlashCommandBuilder()
    .setName('jumbo')
    .setDescription('Enlarge an emoji or emote')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji or emote to enlarge')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const emoji = interaction.options.getString('emoji', true);
    
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary);

    // Check if it's a custom emoji
    const customEmojiMatch = emoji.match(/<:(.*?):(.*?)>/);
    const animatedEmojiMatch = emoji.match(/<a:(.*?):(.*?)>/);
    
    if (customEmojiMatch || animatedEmojiMatch) {
      const isAnimated = !!animatedEmojiMatch;
      const emojiId = (customEmojiMatch || animatedEmojiMatch)![2];
      const extension = isAnimated ? 'gif' : 'png';
      const emojiUrl = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
      
      embed.setImage(emojiUrl);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Check if it's a standard emoji
    try {
      const parsed = parse(emoji, { assetType: 'png' });
      
      if (parsed.length > 0) {
        embed.setImage(parsed[0].url);
        await interaction.reply({ embeds: [embed] });
      } else {
        await interaction.reply({
          content: `${config.emojis.warn} Please provide a valid emoji.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      await interaction.reply({
        content: `${config.emojis.warn} Please provide a valid emoji.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;
