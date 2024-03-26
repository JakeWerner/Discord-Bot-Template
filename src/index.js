require('dotenv').config();
const {Client, Collection, Events, GatewayIntentBits} = require('discord.js');
const fs = require('fs');
const path = require('node:path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

//Listens for the bot to be ready then prints to console
client.on('ready', (c) => {
    console.log(`${c.user.tag} is online.`)
})

//Login to Discord using a TOKEN variable stored in .env
client.login(process.env.TOKEN);
client.commands = new Collection();

//Dynamically Retrieve command files
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

//Dynamically retrieve event files from the events folder
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}
/*
const prefix = '!';

// Load data from events JSON file
let database = {};

function loadDatabase() {
    try {
        const data = fs.readFileSync('src/events.json', 'utf8');
        database = JSON.parse(data);
    } catch (err) {
        console.error('Error loading database:', err);
    }
}

// Save data to events JSON file
function saveDatabase() {
    try {
        fs.writeFileSync('src/events.json', JSON.stringify(database, null, 4), 'utf8');
        console.log('Database saved successfully');
    } catch (err) {
        console.error('Error saving database:', err);
    }
}

client.on('message', message => {
    // Ignore messages from the bot itself and messages without the prefix
    if (message.author.bot || !message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'schedule') {
        // Check if the user is an organizer
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send('You do not have permission to schedule events.');
        }

        // Check if the user has provided event name and date
        if (args.length < 2) {
            return message.channel.send('Please provide an event name and at least one date in the format MM/DD.');
        }

        const eventName = args[0];
        const dates = args.slice(1);

        // Store event details in the map
        database[eventName] = { dates, availability: {} };
        saveDatabase();
        message.channel.send(`Event "${eventName}" scheduled for ${dates.join(', ')}.`);
    }

    // Check if the command matches an existing event
    if (database[command]) {
        // Check if the user has provided at least one date
        if (!args.length) {
            return message.channel.send('Please provide at least one date in the format MM/DD.');
        }

        const dates = args;
        const event = database[command];

        // Store the user's availability for each date
        dates.forEach(date => {
            event.availability[message.author.id] = date;
        });
        saveDatabase();
        message.channel.send(`Your availability for event "${command}" has been recorded for ${dates.join(', ')}.`);
    }

    if (command === 'finalize') {
        // Check if the user is an organizer
        if (!message.member.hasPermission('ADMINISTRATOR')) {
            return message.channel.send('You do not have permission to finalize events.');
        }

        // Check if the user has provided an event name
        if (!args.length) {
            return message.channel.send('Please provide an event name to finalize.');
        }

        const eventName = args[0];

        // Check if the event exists
        if (!database[eventName]) {
            return message.channel.send(`Event "${eventName}" does not exist.`);
        }

        const event = database[eventName];

        // Count the availability for each date
        const availabilityCount = {};
        Object.values(event.availability).forEach(date => {
            availabilityCount[date] = (availabilityCount[date] || 0) + 1;
        });

        // Find the dates with the most availability
        let bestDates = [];
        let maxCount = 0;
        Object.entries(availabilityCount).forEach(([date, count]) => {
            if (count > maxCount) {
                bestDates = [date];
                maxCount = count;
            } else if (count === maxCount) {
                bestDates.push(date);
            }
        });

        // Calculate the percentage of total respondents free on each day
        const totalRespondents = Object.keys(event.availability).length;
        const percentages = {};
        bestDates.forEach(date => {
            const percentage = ((availabilityCount[date] / totalRespondents) * 100).toFixed(2);
            percentages[date] = percentage;
        });

        // Format the message with the list of days and percentages
        let messageContent = `List of available days for event "${eventName}":\n\n`;
        Object.entries(percentages).forEach(([date, percentage]) => {
            messageContent += `${date}: ${percentage}%\n`;
        });
        messageContent += `\nPlease choose a day from the list above to finalize the event.`;

        // Send the message to the organizer
        message.channel.send(messageContent);

        // Delete the event from the map
        delete database[eventName];
        saveDatabase();
    }
});
*/

//Debug message
