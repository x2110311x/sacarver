/* eslint-disable no-undef */
const { EmbedBuilder, DiscordAPIError } = require('discord.js');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('festive')
                .setDescription('Get a fun festive nickname!'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        let month = new Date().getMonth();
        if (month == 11){
            let member = interaction.member;
            let oldNickname = member.displayName;
            let newNickname = `⛄🎁${oldNickname}🎁⛄`;
            if (newNickname.length > 32) {
                const embedReply = new EmbedBuilder()
                    .setColor(0x00873E)
                    .setTitle("That's a long name you got there...")
                    .setDescription("Your nickname is too long! Discord won't let me make you festive.\n Change your nickname and try again")
                    .setFooter({text: oldNickname, iconURL: member.displayAvatarURL()});
                await interaction.reply({ embeds: [embedReply] });

            } else {
                try {
                    await member.setNickname(nick=newNickname, reason="It's festive time!");
                } catch (err){
                    if (err instanceof DiscordAPIError) {
                        const embedReply = new EmbedBuilder()
                        .setColor(0x00873E)
                        .setTitle("Uh oh!")
                        .setDescription("I wasn't able to update your nickname.\n Copy the nickname and set it manually!")
                        .setFooter({text: newNickname, iconURL: member.displayAvatarURL()});
                        await interaction.reply({ content: newNickname, embeds: [embedReply] });
                        return;
                    } else {
                        throw err;
                    }
                }
                const embedReply = new EmbedBuilder()
                    .setColor(0x00873E)
                    .setTitle("Ho Ho Ho *jingle sounds*!")
                    .setDescription("You're lookin' pretty festive there!")
                    .setFooter({text: newNickname, iconURL: member.displayAvatarURL()});
                await interaction.reply({ embeds: [embedReply] });
            }
        } else {
            await interaction.reply({ content: "Hold on there buckaroo! It's not December yet!!!", ephemeral: true});
        }
    }
};