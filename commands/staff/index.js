const fs = require('fs');
const { EmbedBuilder, PermissionFlagsBits, Collection } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let staffCommand = new SlashCommandBuilder()
                    .setName('staff')
                    .setDescription('Staff commands')
                    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

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
    let subcommandGroup = interaction.options.getSubcommandGroup();
    if (subcommandGroup == null){
        subcommandGroup = "";
    } else {
        subcommandGroup = ` ${subcommandGroup} `;
    }
    let subcommandName = "/staff " + subcommandGroup + interaction.options.getSubcommand() +" used";
    let options = interaction.options.data;

    var args = "'";
    var argsExist = false;

    for(let option of options){
        if(option.type > 2){
            args += `${option.name}:${option.value} `;
            argsExist = true;
        }
    }
    args += "`";

    if(!argsExist){
        args = "N/A";
    }

    const staffCommandEmbed = new EmbedBuilder()
    .setTitle(subcommandName)
    .addFields(
      { name: 'Channel', value: `<#${interaction.channel.id}> - ${interaction.channel.id}` },
      { name: 'User', value: `<@${interaction.member.id}> - ${interaction.member.id}`},
      { name: 'Command options', value: `${args}` },
      { name: 'Date Used', value: `<t:${Math.floor(interaction.createdTimestamp/1000)}:F>`},
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
    
    await staffCommandChannel.send({ embeds: [staffCommandEmbed] });
}

module.exports = {
	data: staffCommand,
    async execute(interaction) {
        const staffRole = interaction.options.getRole(interaction.client.config.roles.staff);

        if (!interaction.member.roles.cache.some(staffRole)) {
            await interaction.reply({ephemeral: true, content: "You are not permitted to run staff commands"});
        }

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