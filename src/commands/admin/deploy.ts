import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';
import { REST, Routes } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deploy')
    .setDescription('Deploy slash commands to servers (Owner only)')
    .addSubcommand(subcommand =>
      subcommand
        .setName('global')
        .setDescription('Deploy commands globally (takes up to 1 hour)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('guild')
        .setDescription('Deploy commands to current guild (instant)')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear all commands from current guild')
    ),
  ownerOnly: true,
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild) return;
    
    await interaction.deferReply({ ephemeral: true });
    
    const subcommand = interaction.options.getSubcommand();
    const client = interaction.client as any;
    
    try {
      const rest = new REST().setToken(config.discord.token);
      const commands = Array.from(client.commands.values()).map(command => command.data.toJSON());
      
      switch (subcommand) {
        case 'global': {
          await rest.put(
            Routes.applicationCommands(config.discord.clientId),
            { body: commands }
          );
          
          const embed = new EmbedBuilder()
            .setTitle('✅ Global Deployment Complete')
            .setDescription(`Successfully deployed **${commands.length}** commands globally`)
            .addFields(
              { name: 'Deployment Type', value: 'Global', inline: true },
              { name: 'Commands', value: commands.length.toString(), inline: true },
              { name: 'Propagation Time', value: 'Up to 1 hour', inline: true }
            )
            .setColor(config.colors.success)
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        
        case 'guild': {
          await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, interaction.guild.id),
            { body: commands }
          );
          
          const embed = new EmbedBuilder()
            .setTitle('✅ Guild Deployment Complete')
            .setDescription(`Successfully deployed **${commands.length}** commands to **${interaction.guild.name}**`)
            .addFields(
              { name: 'Deployment Type', value: 'Guild-specific', inline: true },
              { name: 'Commands', value: commands.length.toString(), inline: true },
              { name: 'Propagation Time', value: 'Instant', inline: true }
            )
            .setColor(config.colors.success)
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
          break;
        }
        
        case 'clear': {
          await rest.put(
            Routes.applicationGuildCommands(config.discord.clientId, interaction.guild.id),
            { body: [] }
          );
          
          const embed = new EmbedBuilder()
            .setTitle('🗑️ Commands Cleared')
            .setDescription(`Successfully cleared all commands from **${interaction.guild.name}**`)
            .setColor(config.colors.warning)
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
          break;
        }
      }
    } catch (error) {
      console.error('Deploy command error:', error);
      await interaction.editReply({
        content: `${config.emojis.deny} Failed to deploy commands. Check console for details.`,
      });
    }
  },
} satisfies Command;