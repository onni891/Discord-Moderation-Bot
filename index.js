const { Client, GatewayIntentBits, PermissionsBitField } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    // Ban command
    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const userToBan = message.mentions.users.first() || await client.users.fetch(args[0]).catch(() => null);

        if (!userToBan) {
            return message.reply('Please mention a user or provide a valid user ID to ban.');
        }

        const member = message.guild.members.cache.get(userToBan.id);
        if (member) {
            try {
                await member.ban({ reason: 'Banned by bot command' });
                message.channel.send(`${userToBan.tag} has been banned.`);
            } catch (error) {
                message.reply('I was unable to ban the member. Do I have the necessary permissions?');
            }
        } else {
            message.reply('That user is not in this server.');
        }
    }

    // Unban command
    if (message.content.startsWith('!unban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return message.reply('You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const userId = message.mentions.users.first()?.id || args[0];

        if (!userId) {
            return message.reply('Please provide a user mention or a valid user ID to unban.');
        }

        try {
            const bannedUser = await message.guild.bans.fetch(userId);
            if (bannedUser) {
                await message.guild.bans.remove(userId);
                message.channel.send(`${bannedUser.user.tag} has been unbanned.`);
            } else {
                message.reply('That user is not banned.');
            }
        } catch (error) {
            message.reply('I was unable to unban the member. Are you sure the ID is correct?');
        }
    }
});

client.login(process.env.TOKEN);

