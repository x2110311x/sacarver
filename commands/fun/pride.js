/* eslint-disable no-undef */
const { EmbedBuilder, DiscordAPIError } = require('discord.js');

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('pride')
                .setDescription('Get a fun LGBTQIA+ pride nickname!'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
        let member = interaction.member;
        let oldNickname = member.displayName;
        let newNickname = `🌈${oldNickname}🌈`;
        if (newNickname.length > 32) {
            const embedReply = new EmbedBuilder()
                .setColor(0xEB6123)
                .setTitle("That's a long nickname you got there")
                .setDescription("Your nickname is too long! Discord won't let me make you gay.\n Change your nickname and try again")
                .setFooter({text: oldNickname, iconURL: member.displayAvatarURL()});
            await interaction.reply({ embeds: [embedReply] });

        } else {
            try {
                await member.setNickname(nick=newNickname, reason="GAY");
            } catch (err){
                if (err instanceof DiscordAPIError) {
                    const embedReply = new EmbedBuilder()
                    .setColor(0xEB6123)
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
                .setColor(0xEB6123)
                .setTitle("Slayyy!")
                .setDescription("You're lookin' pretty gay there!")
                .setFooter({text: newNickname, iconURL: member.displayAvatarURL()});
            await interaction.reply({ embeds: [embedReply] });
        }
    }
};