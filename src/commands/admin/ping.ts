import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot\'s latency and response time'),
  async execute(interaction: ChatInputCommandInteraction) {
    const sent = await interaction.reply({ 
      content: 'Pinging...', 
      fetchReply: true 
    });
    
    const wsLatency = interaction.client.ws.ping;
    const apiLatency = sent.createdTimestamp - interaction.createdTimestamp;
    
    // Determine latency quality
    const getLatencyColor = (latency: number) => {
      if (latency < 100) return config.colors.success;
      if (latency < 300) return config.colors.warning;
      return config.colors.error;
    };
    
    const getLatencyEmoji = (latency: number) => {
      if (latency < 100) return '🟢';
      if (latency < 300) return '🟡';
      return '🔴';
    };
    
    const embed = new EmbedBuilder()
      .setTitle('🏓 Pong!')
      .addFields(
        { 
          name: '📡 WebSocket Latency', 
          value: `${getLatencyEmoji(wsLatency)} ${wsLatency}ms`, 
          inline: true 
        },
        { 
          name: '🔄 API Latency', 
          value: `${getLatencyEmoji(apiLatency)} ${apiLatency}ms`, 
          inline: true 
        },
        {
          name: '📊 Status',
          value: wsLatency < 100 && apiLatency < 300 ? 'Excellent' : 
                 wsLatency < 300 && apiLatency < 500 ? 'Good' : 'Poor',
          inline: true
        }
      )
      .setColor(getLatencyColor(Math.max(wsLatency, apiLatency)))
      .setTimestamp()
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      });

    await interaction.editReply({ 
      content: '', 
      embeds: [embed] 
    });
  },
} satisfies Command;