import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command, SpotifyActivity } from '../../types/index.js';
import { config } from '../../config/config.js';
import { formatDistanceToNow } from 'date-fns';

export default {
  data: new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Show what someone is listening to on Spotify')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to check (defaults to you)')
        .setRequired(false)
    ),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    const targetUser = interaction.options.getUser('user') ?? interaction.user;
    const member = await interaction.guild?.members.fetch(targetUser.id);

    if (!member) {
      await interaction.reply({
        content: `${config.emojis.warn} User not found in this server.`,
        ephemeral: true,
      });
      return;
    }

    const spotifyActivity = member.presence?.activities.find(
      (activity): activity is SpotifyActivity => 
        activity.name === 'Spotify' && activity.type === 2 // LISTENING
    );

    if (!spotifyActivity) {
      await interaction.reply({
        content: `${config.emojis.warn} ${targetUser} isn't listening to anything on Spotify.`,
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setAuthor({
        name: 'Spotify',
        iconURL: 'https://www.freepnglogos.com/uploads/spotify-logo-png/file-spotify-logo-png-4.png',
      })
      .setTitle(`**${spotifyActivity.details || 'Unknown Track'}**`)
      .setColor(0x1db954)
      .setFooter({
        text: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (spotifyActivity.assets?.largeImage) {
      const imageUrl = `https://i.scdn.co/image/${spotifyActivity.assets.largeImage.slice(8)}`;
      embed.setThumbnail(imageUrl);
    }

    if (spotifyActivity.assets?.largeText) {
      embed.addFields({ name: '**Album**', value: spotifyActivity.assets.largeText, inline: true });
    }

    if (spotifyActivity.state) {
      embed.addFields({ name: '**Artist**', value: spotifyActivity.state, inline: true });
    }

    if (spotifyActivity.timestamps?.start && spotifyActivity.timestamps?.end) {
      const duration = spotifyActivity.timestamps.end - spotifyActivity.timestamps.start;
      const minutes = Math.floor(duration / 60000);
      const seconds = Math.floor((duration % 60000) / 1000);
      embed.addFields({ 
        name: '**Duration**', 
        value: `${minutes}:${seconds.toString().padStart(2, '0')}`, 
        inline: true 
      });
    }

    if (spotifyActivity.syncID) {
      const spotifyUrl = `https://open.spotify.com/track/${spotifyActivity.syncID}`;
      embed.addFields({
        name: '**Listen on Spotify**',
        value: `[${spotifyActivity.state} - ${spotifyActivity.details}](${spotifyUrl})`,
        inline: false,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;
