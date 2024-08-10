const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Set up Sequelize to connect to your MySQL database
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
});

// Define the Ban model with the new "appealed" column
const Ban = sequelize.define('Ban', {
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    moderatorId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    moderatorName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    reason: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    caseId: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    timestamp: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    appealable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    appealed: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'no',  // Default to 'no'
    },
});

// Sync the model with the database
sequelize.sync()
    .then(() => {
        console.log('Database & tables created!');
    });

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    // Example !ban command that stores data in the database
    if (message.content.startsWith('!ban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return sendTemporaryMessage(message, 'You do not have permission to use this command.');
        }

        const userToBan = message.mentions.users.first();
        const args = message.content.split(' ').slice(1);
        const rawReason = args.slice(1).join(' ') || `${message.author.username}'s ban hammer`;
        const isAppealable = !rawReason.includes('- no appeal');
        const reason = rawReason.trim();

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
                    .setDescription(`**Reason:** ${reason}\n**Length:** Permanent\n\n${isAppealable ? '*If you wish to appeal this ban, please open a ticket at [hosthorizon.eu](https://hosthorizon.eu)*' : '*This ban is non-appealable. Please do not open a ticket complaining about it.*'}`)
                    .setThumbnail(userToBan.displayAvatarURL())
                    .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL() })
                    .setTimestamp();

                await userToBan.send({ embeds: [dmEmbed] });

                // Ban the member
                await member.ban({ reason });

                // Save the ban info to the database
                await Ban.create({
                    userId: userToBan.id,
                    username: userToBan.tag,
                    moderatorId: message.author.id,
                    moderatorName: message.author.tag,
                    reason: reason,
                    caseId: `banid-${Date.now()}`,
                    timestamp: new Date(),
                    appealable: isAppealable,
                });

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

                    await logChannel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error('Failed to ban the member or send a DM:', error);
                const errorMessage = await message.channel.send('I was unable to ban the member or send them a DM. Do I have the necessary permissions?');
                deleteAfterDelay(errorMessage);
            }
        } else {
            const errorMessage = await message.channel.send('That user is not in this server.');
            deleteAfterDelay(errorMessage);
        }
        return;
    }

    // Updated !unban command
    if (message.content.startsWith('!unban')) {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
            return sendTemporaryMessage(message, 'You do not have permission to use this command.');
        }

        const args = message.content.split(' ').slice(1);
        const userId = args[0];

        if (message.mentions.users.first()) {
            return sendTemporaryMessage(message, 'Please don\'t mention the user, only use their Discord ID.');
        }

        if (!userId) {
            return sendTemporaryMessage(message, 'Please provide a valid user ID to unban.');
        }

        try {
            // Delete the command message
            await message.delete();

            const bannedUser = await message.guild.bans.fetch(userId);
            if (bannedUser) {
                await message.guild.bans.remove(userId);

                // Update the "appealed" column in the database
                const banRecord = await Ban.findOne({ where: { userId: userId } });
                if (banRecord) {
                    banRecord.appealed = 'yes';
                    await banRecord.save();
                }

                const confirmationMessage = await message.channel.send(`${bannedUser.user.tag} has been unbanned.`);
                deleteAfterDelay(confirmationMessage);
            } else {
                const errorMessage = await message.channel.send('That user is not banned.');
                deleteAfterDelay(errorMessage);
            }
        } catch (error) {
            console.error('Failed to unban the member:', error);
            const errorMessage = await message.channel.send('I was unable to unban the member. Are you sure the ID is correct?');
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
