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

// Define the list of blacklisted words
const blacklist = [
    "nigger", "nigg3r", "nlgger", "n1gger", "ni44er", "ni443r", "niglet", "nignog",
    "retard", "r3tard", "r3t4rd", "ret4rd", "faggot", "f@ggot", "f4ggot", "fa44ot",
    "fag", "f4g", "fa4", "coon", "c00n", "porch monkey", "dune coon", "dune c00n",
    "towel heads", "raghead", "r4ghead", "rag head", "r4g head", "chinks", "sand monkey",
    "beaner", "spick", "spik", "spic", "paki", "p4ki", "pakkis", "p4kkis", "bimbo",
    "cotton picker", "c0tt0n picker", "curry-muncher", "curry muncher", "dothead",
    "jap", "j4p", "wigger", "wigg3r", "wlgger", "wlgg3r", "wi44er", "wetback",
    "w3tback", "w3tb4ck", "wetb4ck"
];

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    // Check for blacklisted words, only if the user is not an administrator
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const lowerCaseContent = message.content.toLowerCase();
        const containsBlacklistedWord = blacklist.some(word => lowerCaseContent.includes(word));

        if (containsBlacklistedWord) {
            const userToBan = message.author;

            // Automoderation ban reason
            const reason = "Automoderation | Prohibited language";

            try {
                // Delete the message containing the blacklisted word
                await message.delete();

                // Attempt to send a DM to the user
                const dmEmbed = new EmbedBuilder()
                    .setTitle(`You have been banned from ${message.guild.name}`)
                    .setColor(0xff0000)
                    .setDescription(`**Reason:** ${reason}\n**Length:** Permanent\n\n*If you wish to appeal this ban, please open a ticket at [hosthorizon.eu](https://hosthorizon.eu)*`)
                    .setThumbnail(userToBan.displayAvatarURL())
                    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                    .setTimestamp();

                await userToBan.send({ embeds: [dmEmbed] });

                // Ban the member
                await message.guild.members.ban(userToBan, { reason });

                // Log the ban in the specified channel
                const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
                if (logChannel) {
                    const embed = new EmbedBuilder()
                        .setTitle('New Global Ban')
                        .setColor(0xff0000)
                        .setDescription(`**Global Ban Reason:** ${reason}`)
                        .addFields(
                            { name: '👤 User', value: `<@${userToBan.id}> (ID: ${userToBan.id})`, inline: false },
                            { name: '🔨 Moderator', value: `Automoderation`, inline: false },
                            { name: '🆔 Case ID', value: `banid-${Date.now()}`, inline: false },
                            { name: 'Content:', value: message.content, inline: false }
                        )
                        .setThumbnail(userToBan.displayAvatarURL())
                        .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                        .setTimestamp();

                    logChannel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.log('Failed to ban the user, delete the message, or log the ban.');
            }
            return;
        }
    }

    // Regular !ban command
    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return sendTemporaryMessage(message, 'You do not have permission to use this command.');
        }

        const userToBan = message.mentions.users.first();
        const args = message.content.split(' ').slice(1);
        const rawReason = args.slice(1).join(' ') || `${message.author.username}'s ban hammer`;
        const isAppealable = !rawReason.includes('- no appeal');
        const reason = rawReason.trim();
        const appealText = isAppealable
            ? '*If you wish to appeal this ban, please open a ticket at [hosthorizon.eu](https://hosthorizon.eu)*'
            : '*This ban is non-appealable. Please do not open a ticket complaining about it.*';

        if (!userToBan) {
            return sendTemporaryMessage(message, 'Please mention a user to ban.');
        }

        const member = message.guild.members.cache.get(userToBan.id);
        if (member) {
            try {
                // Delete the command message
                await message.delete();

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

                const confirmationMessage = await message.channel.send(`${userToBan.tag} has been banned.`);
                deleteAfterDelay(confirmationMessage);

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
                const errorMessage = await message.reply('I was unable to ban the member or send them a DM. Do I have the necessary permissions?');
                deleteAfterDelay(errorMessage);
            }
        } else {
            const errorMessage = await message.reply('That user is not in this server.');
            deleteAfterDelay(errorMessage);
        }
        return;
    }

    // Unban command
    if (message.content.startsWith('!unban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return sendTemporaryMessage(message, 'You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const userId = message.mentions.users.first()?.id || args[0];

        if (!userId) {
            return sendTemporaryMessage(message, 'Please mention a user or provide a valid user ID to unban.');
        }

        try {
            // Delete the command message
            await message.delete();

            const bannedUser = await message.guild.bans.fetch(userId);
            if (bannedUser) {
                await message.guild.bans.remove(userId);
                const confirmationMessage = await message.channel.send(`${bannedUser.user.tag} has been unbanned.`);
                deleteAfterDelay(confirmationMessage);
            } else {
                const errorMessage = await message.reply('That user is not banned.');
                deleteAfterDelay(errorMessage);
            }
        } catch (error) {
            const errorMessage = await message.reply('I was unable to unban the member. Are you sure the ID is correct?');
            deleteAfterDelay(errorMessage);
        }
    }
});

function sendTemporaryMessage(message, content) {
    message.channel.send(content).then(msg => deleteAfterDelay(msg));
    message.delete().catch(() => {});  // Delete the original command message
}

function deleteAfterDelay(message, delay = 5000) {
    setTimeout(() => {
        message.delete().catch(() => {});
    }, delay);
}

client.login(process.env.TOKEN);
