# Discord Moderation Bot

## Overview

This Discord Moderation Bot is designed to help manage and moderate a Discord server by providing essential moderation commands such as `!ban` and `!unban`. Additionally, the bot includes features for automatically banning users who use blacklisted words, logging ban details in a MySQL database, and providing tools to manage ban appeals.

## Features

- **Ban Command (`!ban`)**: Allows moderators to ban users from the server. The command supports specifying a reason and whether the ban is appealable.
- **Unban Command (`!unban`)**: Allows moderators to unban users using their Discord ID. When a user is unbanned, their ban record is updated to indicate that the ban was appealed.
- **Automoderation**: Automatically bans users who use blacklisted words in the server. These bans are logged with a reason indicating "Automoderation | Prohibited language".
- **Logging**: All bans are logged in a specified Discord channel, including details such as the banned user, the moderator who issued the ban, the reason for the ban, and a unique case ID.
- **Database Integration**: Ban details are stored in a MySQL database, allowing for persistent storage of ban records. This includes fields for the user's ID, username, moderator's ID and username, reason, case ID, timestamp, appealable status, and whether the ban was appealed.

## Setup

### Prerequisites

- **Node.js**: Ensure that Node.js is installed on your system.
- **MySQL**: A running MySQL database (can be set up using XAMPP or another MySQL service).
- **Discord Developer Portal**: A registered bot on the Discord Developer Portal with a valid token.

### Installation

1. **Clone the Repository**: Clone this repository to your local machine.
   git clone <repository-url>
   cd <repository-directory>

2. **Install Dependencies**: Install the necessary Node.js packages.
   npm install

3. **Set Up `.env` File**: Create a `.env` file in the root directory and configure it with your bot token, MySQL credentials, and log channel ID.

   Example `.env` file:

   TOKEN=your-discord-bot-token
   LOG_CHANNEL_ID=your-log-channel-id
   DB_HOST=localhost
   DB_NAME=Discord
   DB_USER=root  # or your MySQL username
   DB_PASS=your_password  # replace with your MySQL password
   DB_PORT=3306

4. **Set Up the Database**: If not already set up, create a MySQL database named `Discord` and add the necessary table schema.

   You can manually add the `Bans` table by running the following SQL command:

   CREATE TABLE Bans (
       id INT AUTO_INCREMENT PRIMARY KEY,
       userId VARCHAR(255) NOT NULL,
       username VARCHAR(255) NOT NULL,
       moderatorId VARCHAR(255) NOT NULL,
       moderatorName VARCHAR(255) NOT NULL,
       reason TEXT NOT NULL,
       caseId VARCHAR(255) NOT NULL,
       timestamp DATETIME NOT NULL,
       appealable BOOLEAN NOT NULL DEFAULT TRUE,
       appealed VARCHAR(3) NOT NULL DEFAULT 'no',
       createdAt DATETIME NOT NULL,
       updatedAt DATETIME NOT NULL
   );

   Alternatively, the bot will create the table automatically when you run it.

5. **Run the Bot**: Start the bot using Node.js.
   node index.js

## Usage

### Commands

- **!ban @user [reason] [- no appeal]**:
  - Bans a user from the server.
  - The reason is optional.
  - Use `- no appeal` to mark the ban as non-appealable.

- **!unban <user-id>**:
  - Unbans a user by their Discord ID.
  - Updates the `appealed` status in the database to "yes".

### Automoderation

The bot automatically bans users who use blacklisted words in the server. The ban is logged in the database and in the specified log channel with the reason "Automoderation | Prohibited language".

### Logging

Every ban, whether manual or automatic, is logged in a specified channel. The log includes:

- The banned user's mention and ID.
- The moderator's mention and ID.
- The reason for the ban.
- A unique case ID.
- The timestamp of the ban.

### Database

Ban records are stored in a MySQL database. The following details are recorded:

- **userId**: The ID of the banned user.
- **username**: The username of the banned user.
- **moderatorId**: The ID of the moderator who issued the ban.
- **moderatorName**: The username of the moderator who issued the ban.
- **reason**: The reason for the ban.
- **caseId**: A unique identifier for the ban case.
- **timestamp**: The date and time when the ban was issued.
- **appealable**: A boolean indicating whether the ban is appealable.
- **appealed**: A string indicating whether the ban was appealed (initially set to 'no' and updated to 'yes' upon unbanning).

## Contributing

If you'd like to contribute to this project, please fork the repository and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the **Apache License 2.0**.

### Apache License 2.0 Summary:

The Apache License 2.0 is a permissive open-source license that allows you to freely use, modify, and distribute the software, provided that you meet the conditions laid out in the license. These conditions include:

- **Attribution**: You must provide proper attribution to the original authors in any derivative works.
- **No Trademark Use**: You cannot use the project’s trademarks, service marks, or trade names without permission.
- **Contribution Licensing**: Contributions made to the project must be licensed under the Apache License 2.0 as well.
- **Patent Rights**: The license grants you a patent license from the contributors to use the software, but if you initiate patent litigation related to the software, your patent license is terminated.

For more details, see the full text of the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).
