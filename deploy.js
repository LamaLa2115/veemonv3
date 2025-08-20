const { REST, Routes } = require('discord.js');
const { readdirSync } = require('fs');
const { join } = require('path');

// Load environment variables
require('dotenv').config();

const commands = [];

// Manually define commands for deployment since TypeScript compilation is complex
const commandDefinitions = [
  // Admin Commands
  { name: 'botinfo', description: 'Display detailed bot information and statistics' },
  { name: 'deploy', description: 'Deploy slash commands to servers (Owner only)' },
  { name: 'eval', description: 'Evaluate JavaScript code (Owner only)' },
  { name: 'ping', description: 'Check the bot\'s latency and API response time' },
  { name: 'portal', description: 'Create invite links to servers the bot is in (Owner only)' },
  { name: 'prefix', description: 'View or change the server prefix' },
  { name: 'reload', description: 'Reload commands and events (Owner only)' },
  { name: 'servers', description: 'View servers the bot is in and create invites (Owner only)' },
  { name: 'status', description: 'Change the bot\'s status (Owner only)' },
  
  // Fun Commands
  { name: '8ball', description: 'Ask the magic 8-ball a question' },
  { name: 'appstore', description: 'Search for iOS apps on the App Store' },
  { name: 'coin', description: 'Flip a coin' },
  { name: 'dice', description: 'Roll a dice with custom sides' },
  { name: 'google', description: 'Search Google for images and web results' },
  { name: 'quote', description: 'Get an inspirational quote' },
  { name: 'urban', description: 'Look up a term in Urban Dictionary' },
  
  // Info Commands
  { name: 'firstmessage', description: 'Get the first message sent in a channel' },
  { name: 'guildbanner', description: 'Display the server banner' },
  { name: 'guildicon', description: 'Display the server icon' },
  { name: 'serverinfo', description: 'Display detailed server information' },
  { name: 'userinfo', description: 'Display detailed user information' },
  
  // Misc Commands
  { name: 'createembed', description: 'Create a custom embed message' },
  { name: 'emojiadd', description: 'Add an emoji to the server from URL or attachment' },
  
  // Moderation Commands
  { name: 'ban', description: 'Ban a user from the server' },
  { name: 'kick', description: 'Kick a user from the server' },
  { name: 'role', description: 'Manage user roles and server roles' },
  { name: 'timeout', description: 'Timeout a user for a specified duration' },
  
  // Server Commands
  { name: 'setbanner', description: 'Set the server banner' },
  { name: 'seticon', description: 'Set the server icon' },
  { name: 'setsplash', description: 'Set the server invite splash' },
  { name: 'voicemaster', description: 'Configure join-to-create voice channels' },
  
  // Utility Commands
  { name: 'afk', description: 'Set or remove your AFK status' },
  { name: 'avatar', description: 'Display a user\'s avatar' },
  { name: 'help', description: 'Display help information for commands' },
  { name: 'jumbo', description: 'Enlarge an emoji' },
  { name: 'math', description: 'Perform mathematical calculations' },
  { name: 'pin', description: 'Pin a message in the channel' },
  { name: 'poll', description: 'Create a poll with multiple options' },
  { name: 'remind', description: 'Set a reminder' },
  { name: 'spotify', description: 'Display Spotify status of a user' },
  { name: 'timestamp', description: 'Generate Discord timestamps' },
  { name: 'twitter', description: 'Get Twitter user information' },
  { name: 'unpin', description: 'Unpin a message in the channel' },
  { name: 'userbanner', description: 'Display a user\'s banner' },
  { name: 'weather', description: 'Get weather information for a location' }
];

// Convert to Discord command format
commands.push(...commandDefinitions);

// Commands are now defined above

console.log(`Loaded ${commands.length} commands for deployment`);

// Deploy commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    // Deploy globally (takes up to 1 hour to propagate)
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

    console.log(`Successfully reloaded ${commands.length} application (/) commands globally.`);
  } catch (error) {
    console.error('Error deploying commands:', error);
  }
})();