const { Collection } = require('discord.js');
const fs = require('fs');
const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands');

const subcommandFiles = fs.readdirSync('./commands/staff').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            staffCommand = subcommand.builder(staffCommand);
            log.debug(`Command /staff ${file} loaded`);
        } catch (e) {
            log.warn({message: `Could not load /staff ${file}`, error:e});
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/staff',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        staffCommand = subcommand.builder(staffCommand);
        log.debug(`Command /staff ${file} loaded`);
    } catch (e) {
        log.warn({message: `Could not load /staff ${file}`, error:e});
        console.error(e);
    }
}


async function logStaffComamnd(interaction){
    let client = interaction.client;
    const staffCommandChannel = await client.channels.fetch(client.config.channels.staffCommandLog);
    let subcommandName = "/staff " + interaction.options.getSubcommand() +" used";
    let options = interaction.options.data;


    const staffCommandEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle(subcommandName)
    .addFields(
      { name: 'Channel', value: `<#${interaction.channel.id}> - ${interaction.channel.id}` },
      { name: 'User', value: `<@${interaction.member.id}> - ${interaction.member.id}`},
      { name: 'Command options', value: `${options}` },
      { name: 'Date Used', value: `<t:${Math.floor(interaction.createdTimestamp/1000)}:F>`},
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
    
    await staffCommandChannel.send({ embeds: [staffCommandEmbed] });
}

module.exports = {
	data: staffCommand,
    async execute(interaction) {
        let subcommandName = interaction.options.getSubcommandGroup();
        if (subcommandName == null) {
            subcommandName = interaction.options.getSubcommand() + '.js';
        }

        let command = subcommands.get(subcommandName);
        interaction.client.log.debug(`Staff subcommand ${subcommandName} ran`);
        await command.execute(interaction);

        await logStaffComamnd(interaction);
	}
};