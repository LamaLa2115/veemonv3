import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import axios from 'axios';

export default {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Get current weather information for a location')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('City name or location to get weather for')
        .setRequired(true)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const location = interaction.options.getString('location', true);
    
    await interaction.deferReply();

    try {
      // Using OpenWeatherMap API (free tier)
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: {
          q: location,
          appid: 'your_api_key_here', // User would need to provide this
          units: 'metric'
        }
      });

      const data = response.data;
      
      const embed = new EmbedBuilder()
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTitle(`Weather in ${data.name}, ${data.sys.country}`)
        .setDescription(`**${data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1)}**`)
        .addFields(
          { name: '🌡️ Temperature', value: `${Math.round(data.main.temp)}°C (${Math.round(data.main.temp * 9/5 + 32)}°F)`, inline: true },
          { name: '🌡️ Feels Like', value: `${Math.round(data.main.feels_like)}°C (${Math.round(data.main.feels_like * 9/5 + 32)}°F)`, inline: true },
          { name: '💧 Humidity', value: `${data.main.humidity}%`, inline: true },
          { name: '💨 Wind Speed', value: `${data.wind.speed} m/s`, inline: true },
          { name: '👁️ Visibility', value: `${(data.visibility / 1000).toFixed(1)} km`, inline: true },
          { name: '🔻 Pressure', value: `${data.main.pressure} hPa`, inline: true }
        )
        .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
        .setColor(config.colors.info)
        .setTimestamp()
        .setFooter({
          text: 'Weather data from OpenWeatherMap',
          iconURL: 'https://openweathermap.org/themes/openweathermap/assets/vendor/owm/img/icons/logo_60x60.png',
        });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        await interaction.editReply({
          content: `${config.emojis.warn} Location **${location}** not found. Please check the spelling and try again.`,
        });
      } else if (axios.isAxiosError(error) && error.response?.status === 401) {
        await interaction.editReply({
          content: `${config.emojis.deny} Weather service is not configured. Please contact the bot administrator.`,
        });
      } else {
        await interaction.editReply({
          content: `${config.emojis.deny} Failed to fetch weather data. Please try again later.`,
        });
      }
    }
  },
} satisfies Command;