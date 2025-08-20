import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('timestamp')
    .setDescription('Generate Discord timestamps for different formats')
    .addStringOption(option =>
      option.setName('time')
        .setDescription('Time to convert (e.g., "2024-12-25 15:30", "in 2 hours", "tomorrow")')
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName('format')
        .setDescription('Timestamp format to display')
        .setRequired(false)
        .addChoices(
          { name: 'Short Time (16:20)', value: 't' },
          { name: 'Long Time (4:20:30 PM)', value: 'T' },
          { name: 'Short Date (20/04/2021)', value: 'd' },
          { name: 'Long Date (20 April 2021)', value: 'D' },
          { name: 'Short Date/Time (20/04/2021 16:20)', value: 'f' },
          { name: 'Long Date/Time (Tuesday, 20 April 2021 4:20 PM)', value: 'F' },
          { name: 'Relative Time (2 months ago)', value: 'R' }
        )
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const timeInput = interaction.options.getString('time');
    const format = interaction.options.getString('format') || 'f';
    
    let targetDate: Date;
    
    if (!timeInput) {
      targetDate = new Date();
    } else {
      // Parse different time formats
      targetDate = parseTimeInput(timeInput);
      
      if (isNaN(targetDate.getTime())) {
        await interaction.reply({
          content: `${config.emojis.warn} Invalid time format. Try formats like:\n• \`2024-12-25 15:30\`\n• \`in 2 hours\`\n• \`tomorrow\`\n• \`next friday\``,
          ephemeral: true,
        });
        return;
      }
    }
    
    const timestamp = Math.floor(targetDate.getTime() / 1000);
    
    // Generate all timestamp formats
    const formats = {
      't': `<t:${timestamp}:t>`,
      'T': `<t:${timestamp}:T>`,
      'd': `<t:${timestamp}:d>`,
      'D': `<t:${timestamp}:D>`,
      'f': `<t:${timestamp}:f>`,
      'F': `<t:${timestamp}:F>`,
      'R': `<t:${timestamp}:R>`
    };
    
    const formatNames = {
      't': 'Short Time',
      'T': 'Long Time', 
      'd': 'Short Date',
      'D': 'Long Date',
      'f': 'Short Date/Time',
      'F': 'Long Date/Time',
      'R': 'Relative Time'
    };
    
    const embed = new EmbedBuilder()
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTitle('🕐 Discord Timestamp Generator')
      .setDescription(`Generated timestamps for: **${targetDate.toLocaleString()}**`)
      .setColor(config.colors.info)
      .setTimestamp();
    
    // Show the selected format prominently
    embed.addFields({
      name: `📋 Your Timestamp (${formatNames[format as keyof typeof formatNames]})`,
      value: `\`${formats[format as keyof typeof formats]}\`\n${formats[format as keyof typeof formats]}`,
      inline: false
    });
    
    // Show all other formats
    const allFormats = Object.entries(formats)
      .filter(([key]) => key !== format)
      .map(([key, value]) => `**${formatNames[key as keyof typeof formatNames]}:** \`${value}\``)
      .join('\n');
    
    embed.addFields({
      name: '🎨 Other Formats',
      value: allFormats,
      inline: false
    });
    
    embed.addFields({
      name: '📖 Usage',
      value: 'Copy any of the timestamp codes above and paste them in Discord to display the formatted time.',
      inline: false
    });
    
    embed.setFooter({
      text: `Unix Timestamp: ${timestamp}`,
    });
    
    await interaction.reply({ embeds: [embed] });
  },
} satisfies Command;

function parseTimeInput(input: string): Date {
  const now = new Date();
  const lowerInput = input.toLowerCase().trim();
  
  // Handle relative time expressions
  if (lowerInput.startsWith('in ')) {
    const timeStr = lowerInput.substring(3);
    const timeMs = parseRelativeTime(timeStr);
    if (timeMs > 0) {
      return new Date(now.getTime() + timeMs);
    }
  }
  
  // Handle common keywords
  switch (lowerInput) {
    case 'now':
      return now;
    case 'tomorrow':
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      return tomorrow;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(12, 0, 0, 0);
      return yesterday;
  }
  
  // Handle "next [day]" format
  if (lowerInput.startsWith('next ')) {
    const day = lowerInput.substring(5);
    const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(day);
    if (dayIndex !== -1) {
      const nextDay = new Date(now);
      const daysUntil = (dayIndex + 7 - nextDay.getDay()) % 7 || 7;
      nextDay.setDate(nextDay.getDate() + daysUntil);
      nextDay.setHours(12, 0, 0, 0);
      return nextDay;
    }
  }
  
  // Try to parse as ISO date or common formats
  return new Date(input);
}

function parseRelativeTime(timeStr: string): number {
  const regex = /(\d+)\s*(second|minute|hour|day|week|month|year)s?/i;
  const match = timeStr.match(regex);
  
  if (!match) return 0;
  
  const amount = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  
  const multipliers = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000
  };
  
  return amount * (multipliers[unit as keyof typeof multipliers] || 0);
}