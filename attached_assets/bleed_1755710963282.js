const { token, default_prefix, color, mongoUrl } = require("./config.json");
const Discord = require("discord.js");
require("@haileybot/sanitize-role-mentions")();
const client = new Discord.Client({
  disableMentions: "everyone",
  fetchAllMembers: true,
  partials: ['MESSAGE', 'REACTION']
});
const mongoose = require('mongoose')
if (mongoUrl && typeof mongoUrl === 'string' && mongoUrl.trim().length > 0) {
  mongoose.connect(mongoUrl, {
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
    .then(() => console.log('connected to mongoose'))
    .catch((err) => console.error('mongoose connection error:', err.message));
} else {
  console.log('No mongoUrl configured; skipping MongoDB connection.');
}
const jointocreate = require("./jointocreate");
jointocreate(client);
client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
client.db = require("quick.db");
module.exports = client;
["command", "event"].forEach(handler => {
  require(`./handlers/${handler}`)(client);
});
Discord.Constants.DefaultOptions.ws.properties.$browser = "Discord Android"

client.login(token)

