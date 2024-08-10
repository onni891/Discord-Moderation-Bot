const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID; // Log channel ID from .env

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

        const userToBan = message.mentions.users.first();
        const args = message.content.split(' ').slice(1);
        const rawReason = args.slice(1).join(' ') || `${message.author.username}'s ban hammer`;
        const isAppealable = !rawReason.includes('- no appeal');
        const reason = rawReason.replace('- no appeal', '').trim();
        const appealText = isAppealable
            ? '*If you wish to appeal this ban, please open a ticket at [hosthorizon.eu](https://hosthorizon.eu)*'
            : '*This ban is non-appealable. Please do not open a ticket complaining about it.*';

        if (!userToBan) {
            return message.reply('Please mention a user to ban.');
        }

        const member = message.guild.members.cache.get(userToBan.id);
        if (member) {
            try {
                // Attempt to send a DM to the user
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`You have been banned from ${message.guild.name}`)
                    .setColor(0xff0000)
                    .setDescription(`**Reason:** ${reason}\n**Length:** Permanent\n\n${appealText}`)
                    .setThumbnail(userToBan.displayAvatarURL())
                    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                    .setTimestamp();

                await userToBan.send({ embeds: [dmEmbed] });

                // Ban the member
                await member.ban({ reason });

                message.channel.send(`${userToBan.tag} has been banned.`);

                // Log the ban in the specified channel
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('New Global Ban')
                        .setColor(0xff0000)
                        .setDescription(`**Global Ban Reason:** ${reason}`)
                        .addFields(
                            { name: '👤 User', value: `<@${userToBan.id}> (ID: ${userToBan.id})`, inline: false },
                            { name: '🔨 Moderator', value: `<@${message.author.id}> (ID: ${message.author.id})`, inline: false },
                            { name: '🆔 Case ID', value: `banid-${Date.now()}`, inline: false }
                        )
                        .setThumbnail(userToBan.displayAvatarURL())
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                        .setTimestamp();

                    logChannel.send({ embeds: [embed] });
                }
            } catch (error) {
                message.reply('I was unable to ban the member or send them a DM. Do I have the necessary permissions?');
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
            return message.reply('Please mention a user or provide a valid user ID to unban.');
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
