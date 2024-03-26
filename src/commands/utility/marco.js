const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marco')
        .setDescription('Replies with polo'),
    async executionAsyncResource(interaction){
        await interaction.reply('Polo!');
    },
};
