const fs = require('fs');

const { prefix, token, clientID, secret } = require('./config.json'); // config.json file includes token, so not including in repo.

const Discord = require('discord.js');
const client = new Discord.Client();

const cooldowns = new Discord.Collection();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
}

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {
    if (!message.guild.me.hasPermission('VIEW_CHANNEL') || !message.guild.me.hasPermission('SEND_MESSAGES')) {
        console.log(`I don't have the permissions to view channels or send messages in ${message.guild.nameAcronym} (${message.guild.name}).`);
    }

    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const commandName = args.shift().toLowerCase();

    if (commandName === 'stats') {
        const promises = [
            client.shard.fetchClientValues('guilds.cache.size'),
            client.shard.broadcastEval('this.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0)'),
        ];
        
        Promise.all(promises)
            .then(results => {
                const totalGuilds = results[0].reduce((acc, guildCount) => acc + guildCount, 0);
                const totalMembers = results[1].reduce((acc, memberCount) => acc + memberCount, 0);
                return message.channel.send(`Total guilds: ${totalGuilds}\nTotal members: ${totalMembers}`);
            })
            .catch(console.error);
    }
    
    const command = client.commands.get(commandName)
        || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (message.channel.type === 'dm') return;

    if (command.args && !args.length) {
        let reply = `${message.author}, you need to supply arguments.`;

        if (command.usage) {
            reply = `Use the command like this: \`${prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return message.reply(`Command on cooldown! ${timeLeft.toFixed(1)}`);
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
    }

    try {
	    command.execute(message, args);
    } catch (error) {
	    console.error('Error executing command:', error);
	    message.reply('there was an error trying to execute that command!');
    }
});

client.on('shardError', error => {
    console.error('A websocket connection encountered an error:', error);
});

process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(token);
