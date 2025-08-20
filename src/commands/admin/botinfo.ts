import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, version as djsVersion } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import { version } from 'process';

export default {
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Get detailed information about the bot'),
  async execute(interaction: ChatInputCommandInteraction) {
    const client = interaction.client;
    const uptime = process.uptime();
    
    // Format uptime
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor(uptime / 3600) % 24;
    const minutes = Math.floor(uptime / 60) % 60;
    const seconds = Math.floor(uptime) % 60;
    
    const uptimeString = [
      days > 0 ? `${days}d` : '',
      hours > 0 ? `${hours}h` : '',
      minutes > 0 ? `${minutes}m` : '',
      `${seconds}s`
    ].filter(Boolean).join(' ');
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memoryUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);
    const memoryTotal = (memUsage.heapTotal / 1024 / 1024).toFixed(2);
    
    // Get command count
    const commandCount = (client as any).commands?.size || 0;
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: client.user?.tag || 'Bot',
        iconURL: client.user?.displayAvatarURL(),
      })
      .setTitle('🤖 Bot Information')
      .setThumbnail(client.user?.displayAvatarURL() || null)
      .addFields(
        {
          name: '📊 Statistics',
          value: [
            `**Servers:** ${client.guilds.cache.size}`,
            `**Users:** ${client.users.cache.size}`,
            `**Channels:** ${client.channels.cache.size}`,
            `**Commands:** ${commandCount}`
          ].join('\n'),
          inline: true
        },
        {
          name: '⚡ Performance',
          value: [
            `**Uptime:** ${uptimeString}`,
            `**Memory:** ${memoryUsed}MB / ${memoryTotal}MB`,
            `**Ping:** ${client.ws.ping}ms`,
            `**CPU:** ${process.cpuUsage().user / 1000000}ms`
          ].join('\n'),
          inline: true
        },
        {
          name: '🔧 Technical',
          value: [
            `**Node.js:** ${version}`,
            `**Discord.js:** v${djsVersion}`,
            `**Environment:** ${config.environment}`,
            `**Prefix:** \`${config.bot.defaultPrefix}\``
          ].join('\n'),
          inline: true
        },
        {
          name: '👑 Owner',
          value: `<@${config.discord.ownerId}>`,
          inline: true
        },
        {
          name: '🕐 Created',
          value: `<t:${Math.floor((client.user?.createdTimestamp || 0) / 1000)}:R>`,
          inline: true
        }
      )
      .setColor(config.colors.primary)
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;