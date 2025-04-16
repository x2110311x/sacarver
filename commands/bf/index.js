const fs = require('fs');
const { EmbedBuilder, PermissionFlagsBits, Collection } = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');

const log = require('../../structures/logging').getInstance().logger;


const subcommands = new Collection();

let bfCommand = new SlashCommandBuilder()
                    .setName('bf')
                    .setDescription('Blurryface commands')
                    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

const subcommandFiles = fs.readdirSync('./commands/bf').filter(file => file.endsWith('.js'));
for (const file of subcommandFiles) {
    if (file != 'index.js') {
        try {
            const subcommand = require(`./${file}`);
            subcommands.set(`${file}`, subcommand);
            bfCommand = subcommand.builder(bfCommand);
            log.debug(`Command /bf ${file} loaded`);
        } catch (e) {
            log.warn({message: `Could not load /bf ${file}`, error:e});
        }
    }
}


const subcommandFolders = fs.readdirSync('./commands/bf',  { withFileTypes: true }).filter((item) => item.isDirectory()).map((item) => item.name);
for (const file of subcommandFolders) {
    try {
        const subcommand = require(`./${file}`);
        subcommands.set(`${file}`, subcommand);
        bfCommand = subcommand.builder(bfCommand);
        log.debug(`Command /bf ${file} loaded`);
    } catch (e) {
        log.warn({message: `Could not load /bf ${file}`, error:e});
        console.error(e);
    }
}


module.exports = {
	data: bfCommand,
    async execute(interaction) {
        /*const bfRole = interaction.options.getRole(interaction.client.config.roles.bf);

        if (!interaction.member.roles.cache.has(bfRole)) {
            await interaction.reply({ephemeral: true, content: "You are not permitted to run bf commands"});
            return;
        }*/

        let subcommandName = interaction.options.getSubcommandGroup();
        if (subcommandName == null) {
            subcommandName = interaction.options.getSubcommand() + '.js';
        }

        let command = subcommands.get(subcommandName);
        interaction.client.log.debug(`bf subcommand ${subcommandName} ran`);
        await command.execute(interaction);

        await logbfComamnd(interaction);
	}
};