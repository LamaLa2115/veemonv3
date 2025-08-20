const Discord = require('discord.js');
const { color } = require("../../config.json");

module.exports = {
  name: "faq",

  run: async (client, message, args) => {
    if (message.author.id !== '615635897924190218') return;

    const embed = new Discord.MessageEmbed()
      .setAuthor(`veemon`, message.author.avatarURL())
      .setImage('https://cdn.discordapp.com/banners/1406981463638937792/f3ce127dea413e276c27de88c6e5111d')
      .setTitle(`Getting started with veemon`)
      .setDescription(`Learn how to set up veemon in your server or enhance your everyday use with commands & more.\nBy default, in a server with veemon, the prefix for the bot is a comma ,.`)
      .addField(`**Hey There,**`, `\u3000Welcome to the support server for veemon, a multi-purpose Discord bot fitting all communities with an easy-to-use system. This is the landing page to help you get set up and explaining all the commands you need to know.`)
      .addField(`**Why veemon?**`, `veemon is a sophisticated bot. Unlike many bots, veemon focuses on a smooth theme, with ease of access to a wide range of commands that may require multiple bots for. Some of it's notable features include Altdentifier, Autorole,  Modlogs, Custom Prefixes and Welcome Messages, also an easy-to-use embed feature. It's the ultimate all in one Discord bot for all servers.`)
      .addField(`**FAQ**`, `Please reach out to **MVwt** on Discord for priority replies. Additionally, you can join the [support server](in developmentP) and send a message in the main channel which will automatically alert us.
  If you are not in the support server or would like an alternative option, you may use ,help in any guild, and veemon will DM you so you can submit your request and contact the developers through the bot.
Alternatively, direct message MVwt with your request.`)
      .setColor(color)
      .setFooter('veemon bot')
      .setTimestamp()
    return message.channel.send(embed)
  }
}