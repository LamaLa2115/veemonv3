import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, Role, GuildMember } from 'discord.js';
import { Command } from '../../types/index';
import { config } from '../../config/config';

export default {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage roles and role presets')
    .addSubcommandGroup(group =>
      group
        .setName('user')
        .setDescription('Manage user roles')
        .addSubcommand(subcommand =>
          subcommand
            .setName('add')
            .setDescription('Add a role to a user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to add the role to')
                .setRequired(true)
            )
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to add')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('reason')
                .setDescription('Reason for adding the role')
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('remove')
            .setDescription('Remove a role from a user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to remove the role from')
                .setRequired(true)
            )
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('reason')
                .setDescription('Reason for removing the role')
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('list')
            .setDescription('List all roles of a user')
            .addUserOption(option =>
              option.setName('user')
                .setDescription('The user to list roles for')
                .setRequired(true)
            )
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('manage')
        .setDescription('Manage server roles')
        .addSubcommand(subcommand =>
          subcommand
            .setName('create')
            .setDescription('Create a new role')
            .addStringOption(option =>
              option.setName('name')
                .setDescription('Name of the role')
                .setRequired(true)
            )
            .addStringOption(option =>
              option.setName('color')
                .setDescription('Role color (hex code like #ff0000)')
                .setRequired(false)
            )
            .addBooleanOption(option =>
              option.setName('mentionable')
                .setDescription('Whether the role can be mentioned')
                .setRequired(false)
            )
            .addBooleanOption(option =>
              option.setName('hoisted')
                .setDescription('Whether the role is displayed separately')
                .setRequired(false)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('delete')
            .setDescription('Delete a role')
            .addRoleOption(option =>
              option.setName('role')
                .setDescription('The role to delete')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('list')
            .setDescription('List all server roles')
        )
    )
    .addSubcommandGroup(group =>
      group
        .setName('preset')
        .setDescription('Manage role presets')
        .addSubcommand(subcommand =>
          subcommand
            .setName('create')
            .setDescription('Create a role preset from a user\'s roles')
            .addStringOption(option =>
              option.setName('name')
                .setDescription('Name for the preset')
                .setRequired(true)
            )
            .addUserOption(option =>
              option.setName('user')
                .setDescription('User to copy roles from')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('apply')
            .setDescription('Apply a role preset to a user')
            .addStringOption(option =>
              option.setName('preset')
                .setDescription('Name of the preset to apply')
                .setRequired(true)
            )
            .addUserOption(option =>
              option.setName('user')
                .setDescription('User to apply preset to')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('list')
            .setDescription('List all role presets')
        )
        .addSubcommand(subcommand =>
          subcommand
            .setName('delete')
            .setDescription('Delete a role preset')
            .addStringOption(option =>
              option.setName('preset')
                .setDescription('Name of the preset to delete')
                .setRequired(true)
            )
        )
    ),
  permissions: [PermissionFlagsBits.ManageRoles],
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction) {
    if (!interaction.guild || !interaction.member) return;
    
    const group = interaction.options.getSubcommandGroup();
    const subcommand = interaction.options.getSubcommand();
    
    try {
      switch (`${group}.${subcommand}`) {
        case 'user.add': {
          const user = interaction.options.getUser('user', true);
          const role = interaction.options.getRole('role', true) as Role;
          const reason = interaction.options.getString('reason') || 'No reason provided';
          
          const member = await interaction.guild.members.fetch(user.id);
          const botMember = interaction.guild.members.me!;
          const moderator = interaction.member as GuildMember;
          
          // Check if role can be managed
          if (role.position >= botMember.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} I cannot manage the role **${role.name}** as it's higher than my highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          // Check moderator permissions (unless owner)
          if (interaction.user.id !== config.discord.ownerId && role.position >= moderator.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} You cannot manage the role **${role.name}** as it's higher than your highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          if (member.roles.cache.has(role.id)) {
            await interaction.reply({
              content: `${config.emojis.warn} **${user.tag}** already has the role **${role.name}**.`,
              ephemeral: true,
            });
            return;
          }
          
          await member.roles.add(role, `${reason} | Added by ${interaction.user.tag}`);
          
          const embed = new EmbedBuilder()
            .setTitle('✅ Role Added')
            .setDescription(`Successfully added **${role.name}** to **${user.tag}**`)
            .addFields(
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
              { name: 'Moderator', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false }
            )
            .setColor(role.color || config.colors.success)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'user.remove': {
          const user = interaction.options.getUser('user', true);
          const role = interaction.options.getRole('role', true) as Role;
          const reason = interaction.options.getString('reason') || 'No reason provided';
          
          const member = await interaction.guild.members.fetch(user.id);
          const botMember = interaction.guild.members.me!;
          const moderator = interaction.member as GuildMember;
          
          // Check if role can be managed
          if (role.position >= botMember.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} I cannot manage the role **${role.name}** as it's higher than my highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          // Check moderator permissions (unless owner)
          if (interaction.user.id !== config.discord.ownerId && role.position >= moderator.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} You cannot manage the role **${role.name}** as it's higher than your highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          if (!member.roles.cache.has(role.id)) {
            await interaction.reply({
              content: `${config.emojis.warn} **${user.tag}** doesn't have the role **${role.name}**.`,
              ephemeral: true,
            });
            return;
          }
          
          await member.roles.remove(role, `${reason} | Removed by ${interaction.user.tag}`);
          
          const embed = new EmbedBuilder()
            .setTitle('❌ Role Removed')
            .setDescription(`Successfully removed **${role.name}** from **${user.tag}**`)
            .addFields(
              { name: 'User', value: `${user.tag} (${user.id})`, inline: true },
              { name: 'Role', value: `${role.name} (${role.id})`, inline: true },
              { name: 'Moderator', value: interaction.user.tag, inline: true },
              { name: 'Reason', value: reason, inline: false }
            )
            .setColor(role.color || config.colors.warning)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'user.list': {
          const user = interaction.options.getUser('user', true);
          const member = await interaction.guild.members.fetch(user.id);
          
          const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(role => role.toString());
          
          const embed = new EmbedBuilder()
            .setTitle(`🎭 Roles for ${user.tag}`)
            .setThumbnail(user.displayAvatarURL())
            .setColor(member.displayHexColor || config.colors.primary)
            .setTimestamp();
          
          if (roles.length === 0) {
            embed.setDescription('This user has no roles.');
          } else {
            embed.setDescription(`**${roles.length}** role(s):\n${roles.join(' ')}`);
            embed.addFields({
              name: 'Highest Role',
              value: member.roles.highest.toString(),
              inline: true
            });
          }
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'manage.create': {
          const name = interaction.options.getString('name', true);
          const colorHex = interaction.options.getString('color');
          const mentionable = interaction.options.getBoolean('mentionable') ?? false;
          const hoisted = interaction.options.getBoolean('hoisted') ?? false;
          
          let color: number | undefined;
          if (colorHex) {
            const hex = colorHex.replace('#', '');
            if (!/^[0-9A-F]{6}$/i.test(hex)) {
              await interaction.reply({
                content: `${config.emojis.warn} Invalid color format. Use hex format like #ff0000`,
                ephemeral: true,
              });
              return;
            }
            color = parseInt(hex, 16);
          }
          
          const role = await interaction.guild.roles.create({
            name,
            color,
            mentionable,
            hoist: hoisted,
            reason: `Role created by ${interaction.user.tag}`
          });
          
          const embed = new EmbedBuilder()
            .setTitle('✅ Role Created')
            .setDescription(`Successfully created role **${role.name}**`)
            .addFields(
              { name: 'Name', value: role.name, inline: true },
              { name: 'ID', value: role.id, inline: true },
              { name: 'Position', value: role.position.toString(), inline: true },
              { name: 'Mentionable', value: mentionable ? 'Yes' : 'No', inline: true },
              { name: 'Hoisted', value: hoisted ? 'Yes' : 'No', inline: true },
              { name: 'Color', value: color ? `#${color.toString(16).padStart(6, '0')}` : 'Default', inline: true }
            )
            .setColor(role.color || config.colors.success)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'manage.delete': {
          const role = interaction.options.getRole('role', true) as Role;
          const botMember = interaction.guild.members.me!;
          const moderator = interaction.member as GuildMember;
          
          // Check if role can be managed
          if (role.position >= botMember.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} I cannot delete the role **${role.name}** as it's higher than my highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          // Check moderator permissions (unless owner)
          if (interaction.user.id !== config.discord.ownerId && role.position >= moderator.roles.highest.position) {
            await interaction.reply({
              content: `${config.emojis.deny} You cannot delete the role **${role.name}** as it's higher than your highest role.`,
              ephemeral: true,
            });
            return;
          }
          
          if (role.managed) {
            await interaction.reply({
              content: `${config.emojis.deny} Cannot delete **${role.name}** as it's managed by an integration.`,
              ephemeral: true,
            });
            return;
          }
          
          const roleName = role.name;
          const memberCount = role.members.size;
          
          await role.delete(`Role deleted by ${interaction.user.tag}`);
          
          const embed = new EmbedBuilder()
            .setTitle('🗑️ Role Deleted')
            .setDescription(`Successfully deleted role **${roleName}**`)
            .addFields(
              { name: 'Members Affected', value: memberCount.toString(), inline: true },
              { name: 'Deleted By', value: interaction.user.tag, inline: true }
            )
            .setColor(config.colors.error)
            .setTimestamp();
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        case 'manage.list': {
          const roles = interaction.guild.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .first(20); // Limit to 20 roles to avoid embed limits
          
          const embed = new EmbedBuilder()
            .setTitle(`🎭 Server Roles (${interaction.guild.roles.cache.size - 1})`)
            .setDescription(roles.map((role, index) => 
              `${index + 1}. ${role} (${role.members.size} members)`
            ).join('\n') || 'No roles found.')
            .setColor(config.colors.primary)
            .setTimestamp();
          
          if (interaction.guild.roles.cache.size > 21) {
            embed.setFooter({ text: 'Showing first 20 roles' });
          }
          
          await interaction.reply({ embeds: [embed] });
          break;
        }
        
        default: {
          await interaction.reply({
            content: `${config.emojis.warn} Role preset functionality is coming soon!`,
            ephemeral: true,
          });
          break;
        }
      }
    } catch (error) {
      console.error('Role command error:', error);
      await interaction.reply({
        content: `${config.emojis.deny} An error occurred while managing roles.`,
        ephemeral: true,
      });
    }
  },
} satisfies Command;