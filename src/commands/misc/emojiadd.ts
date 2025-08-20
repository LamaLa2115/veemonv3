import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js';
import { Command } from '../../types/index.js';
import { config } from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('emojiadd')
    .setDescription('Add an emoji to the server')
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji to add (custom emoji or URL)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('name')
        .setDescription('Custom name for the emoji (optional)')
        .setRequired(false)
    ),
  permissions: [PermissionFlagsBits.ManageGuildExpressions],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;

    const emojiInput = interaction.options.getString('emoji', true);
    const customName = interaction.options.getString('name');

    await interaction.deferReply();

    try {
      // Check if it's a custom emoji
      const emojiMatch = emojiInput.match(/<a?:(\w+):(\d+)>/);
      
      if (emojiMatch) {
        const [, name, id] = emojiMatch;
        const isAnimated = emojiInput.startsWith('<a:');
        const extension = isAnimated ? '.gif' : '.png';
        const emojiUrl = `https://cdn.discordapp.com/emojis/${id}${extension}`;
        const finalName = customName || name;

        const newEmoji = await interaction.guild.emojis.create({
          attachment: emojiUrl,
          name: finalName,
        });

        await interaction.editReply({
          content: `${config.emojis.approve} Added \`:${newEmoji.name}:\` to this server!`,
        });
      } else if (emojiInput.startsWith('http')) {
        // Direct URL
        if (!customName) {
          await interaction.editReply({
            content: `${config.emojis.warn} Please provide a name for the emoji when using a URL.`,
          });
          return;
        }

        const newEmoji = await interaction.guild.emojis.create({
          attachment: emojiInput,
          name: customName,
        });

        await interaction.editReply({
          content: `${config.emojis.approve} Added \`:${newEmoji.name}:\` to this server!`,
        });
      } else {
        await interaction.editReply({
          content: `${config.emojis.warn} Please provide a valid custom emoji or image URL.`,
        });
      }
    } catch (error) {
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to add emoji. Make sure the image is valid and under 256KB.`,
      });
    }
  },
} satisfies Command;
