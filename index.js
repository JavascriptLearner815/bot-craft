const { prefix, token } = require('./config.json');

const Discord = require('discord.js');
const client = new Discord.Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
	if (message.content === `${prefix}server`) {
		message.channel.send(`Server name: ${message.guild.name}\nTotal members: ${message.guild.memberCount}\nCreated: ${message.guild.createdAt}\nLocation: ${message.guild.region}`);
	} else if (message.content === `${prefix}user-info`) {
        message.channel.send(`Username: ${message.author.username}\nID: ${message.author.id}`);
	}
});

client.login(token);
