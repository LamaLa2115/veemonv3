import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help and see all available commands')
    .addStringOption(option =>
      option.setName('command')
        .setDescription('Get detailed information about a specific command')
        .setRequired(false)
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const specificCommand = interaction.options.getString('command');
    
    if (specificCommand) {
      // Show specific command help
      const client = interaction.client as any;
      const command = client.commands?.get(specificCommand);
      
      if (!command) {
        await interaction.reply({
          content: `${config.emojis.warn} Command \`${specificCommand}\` not found.`,
          ephemeral: true,
        });
        return;
      }

      const embed = new EmbedBuilder()
        .setTitle(`Command: /${command.data.name}`)
        .setDescription(command.data.description)
        .setColor(config.colors.primary)
        .setTimestamp();

      if (command.data.options && command.data.options.length > 0) {
        const options = command.data.options.map((opt: any) => {
          const required = opt.required ? '**Required**' : 'Optional';
          return `\`${opt.name}\` - ${opt.description} (${required})`;
        }).join('\n');
        
        embed.addFields({ name: 'Options', value: options, inline: false });
      }

      if (command.permissions) {
        embed.addFields({ 
          name: 'Required Permissions', 
          value: command.permissions.join(', '), 
          inline: false 
        });
      }

      if (command.ownerOnly) {
        embed.addFields({ name: 'Restriction', value: 'Owner Only', inline: true });
      }

      if (command.guildOnly) {
        embed.addFields({ name: 'Scope', value: 'Server Only', inline: true });
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    // Main help menu with categories
    const commandCategories = {
      '🛡️ Moderation': ['ban', 'kick', 'timeout', 'role'],
      '🎮 Fun': ['8ball', 'coin', 'dice', 'quote', 'appstore', 'google', 'urban'],
      '📊 Info': ['botinfo', 'firstmessage', 'guildbanner', 'guildicon', 'serverinfo', 'userinfo'],
      '🔧 Utility': ['afk', 'avatar', 'help', 'jumbo', 'math', 'pin', 'poll', 'remind', 'spotify', 'timestamp', 'twitter', 'unpin', 'userbanner', 'weather'],
      '🎨 Server': ['prefix', 'setbanner', 'seticon', 'setsplash'],
      '⚙️ Misc': ['createembed', 'emojiadd'],
      '👑 Admin': ['deploy', 'eval', 'ping', 'reload', 'servers', 'status']
    };

    const mainEmbed = new EmbedBuilder()
      .setTitle(`${interaction.client.user?.username} Help Menu`)
      .setDescription('Select a category below to view commands, or use `/help <command>` for detailed information about a specific command.')
      .setColor(config.colors.primary)
      .setThumbnail(interaction.client.user?.displayAvatarURL() || null)
      .addFields(
        { 
          name: '📋 Quick Stats', 
          value: `**Total Commands:** 42\n**Categories:** ${Object.keys(commandCategories).length}\n**Prefix:** \`/\` (Slash Commands)`, 
          inline: false 
        },
        {
          name: '🔗 Useful Links',
          value: '[Support Server](https://discord.gg/example) • [Invite Bot](https://discord.com/api/oauth2/authorize?client_id=${config.discord.clientId}&permissions=8&scope=bot%20applications.commands)',
          inline: false
        }
      )
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('help_category')
      .setPlaceholder('Choose a command category')
      .addOptions(
        Object.keys(commandCategories).map(category => ({
          label: category,
          value: category.toLowerCase().replace(/[^a-z]/g, ''),
          description: `View ${commandCategories[category as keyof typeof commandCategories].length} commands`,
          emoji: category.split(' ')[0]
        }))
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(selectMenu);

    const response = await interaction.reply({
      embeds: [mainEmbed],
      components: [row],
    });

    // Handle select menu interactions
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000,
    });

    collector.on('collect', async (selectInteraction) => {
      if (selectInteraction.user.id !== interaction.user.id) {
        await selectInteraction.reply({
          content: 'This help menu can only be used by the person who requested it.',
          ephemeral: true,
        });
        return;
      }

      const selectedCategory = selectInteraction.values[0];
      const categoryName = Object.keys(commandCategories).find(cat => 
        cat.toLowerCase().replace(/[^a-z]/g, '') === selectedCategory
      );

      if (!categoryName) return;

      const commands = commandCategories[categoryName as keyof typeof commandCategories];
      const commandList = commands.map(cmd => `\`/${cmd}\``).join(' • ');

      const categoryEmbed = new EmbedBuilder()
        .setTitle(`${categoryName} Commands`)
        .setDescription(`Here are all the commands in the **${categoryName}** category:`)
        .addFields({
          name: 'Available Commands',
          value: commandList,
          inline: false
        })
        .addFields({
          name: 'Usage',
          value: 'Use `/help <command>` to get detailed information about any command.',
          inline: false
        })
        .setColor(config.colors.primary)
        .setTimestamp()
        .setFooter({
          text: `${commands.length} commands in this category`,
        });

      await selectInteraction.update({
        embeds: [categoryEmbed],
        components: [row],
      });
    });

    collector.on('end', async () => {
      try {
        await response.edit({
          components: [],
        });
      } catch {
        // Message may have been deleted
      }
    });
  },
} satisfies Command;