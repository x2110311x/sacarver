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
    }
}


async function logStaffComamnd(interaction){
    let client = interaction.client;
    try {
        const staffCommandChannel = await client.channels.fetch(client.config.channels.staffCommandLog);
        if (!staffCommandChannel) {
            client.log.warn({ message: `Could not fetch staff command log channel (${client.config.channels.staffCommandLog})` });
            return;
        }

        let subcommandGroup = interaction.options.getSubcommandGroup();
        if (subcommandGroup == null){
            subcommandGroup = "";
        } else {
            subcommandGroup = ` ${subcommandGroup} `;
        }
        let subcommandName = "/staff " + subcommandGroup + interaction.options.getSubcommand() +" used";
        let options = (interaction.options.data[0] && interaction.options.data[0].options) ? interaction.options.data[0].options : [];

        if (options[0] && options[0].type == 1){
            options = options[0].options || [];
        }

        var args = "";
        var argsExist = false;
        var files = [];

        for(let option of options){
            if(option.type > 2){
                if (option.type === 11 || option.attachment) {
                    const attachment = option.attachment || interaction.options.getAttachment(option.name);
                    if (attachment) {
                        files.push({
                            attachment: attachment.url,
                            name: attachment.name
                        });
                        args += `${option.name}:${attachment.name}, `;
                    } else {
                        args += `${option.name}:${option.value}, `;
                    }
                } else {
                    args += `${option.name}:${option.value}, `;
                }
                argsExist = true;
            }
        }

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
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${interaction.client.icon}` });
        
        const payload = { embeds: [staffCommandEmbed] };
        if (files.length > 0) {
            payload.files = files;
        }

        try {
            await staffCommandChannel.send(payload);
        } catch (sendErr) {
            if (files.length > 0) {
                await staffCommandChannel.send({ embeds: [staffCommandEmbed] });
            } else {
                throw sendErr;
            }
        }
    } catch (e) {
        client.log.error({ message: "Error logging staff command", error: e });
    }
}

module.exports = {
	data: staffCommand,
    async execute(interaction) {
        /*const staffRole = interaction.options.getRole(interaction.client.config.roles.staff);

        if (!interaction.member.roles.cache.has(staffRole)) {
            await interaction.reply({ephemeral: true, content: "You are not permitted to run staff commands"});
            return;
        }*/

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