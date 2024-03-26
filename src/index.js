const {Client, GatewayIntentBits} = require('discord.js');
const fs = require('fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});
client.login('MTIyMjI3ODkwNjc5OTg1MzY2MA.Gl2my6.3kX18p3A9gdkuHY9UkiY0ZF3uLWEroSesrCDhQ');
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

//Debug message
console.log('Code ran successfully');
