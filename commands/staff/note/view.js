const { EmbedBuilder } = require('discord.js');


module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('view')
              .setDescription('View notes for a user')
              .addUserOption(option =>
                  option.setName('user')
                      .setDescription('The user to check notes for, if they are in the server')
                      .setRequired(false))
              .addStringOption(option =>
                  option.setName('userid')
                      .setDescription('The ID of the user to check notes for, if they are not in the server')
                      .setRequired(false)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    await interaction.deferReply();
    const client = interaction.client;

    var user = interaction.options.getUser('user');
    if (user == null){
        user = interaction.options.getString('userid');
        if (user == null){
        let errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("Command Error")
        .setDescription("Please specify a user or user ID")
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

        await interaction.editReply({ephemeral: true, embeds: [errorEmbed]});
        return;
        }
    } else {
        user = user.id;
    }
    
    try{ 
        const notes = await client.DB.Notes.findAll({
            where: {
                User: user
            }
        });
        client.log.debug(`${notes.length} notes retrieved`);

        const guild = interaction.guild;
        const member = await guild.members.fetch(`${user}`);
        
        const noteEmbed = new EmbedBuilder()
            .setColor(0xffff88)
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL})
            .setDescription("Please review, and then click Submit or Cancel");
        
        for (var note of notes){
            noteEmbed.addFields({
                'name': `${note.Severity} severity note submitted by <@${note.Noter}> on <t:${note.date}:F>`,
                value: note.Note
            });
        }

        client.log.debug(noteEmbed.data);

        await interaction.editReply({embeds: [noteEmbed]});
    } catch (err){
        client.log.error({message: "Error retrievingn staff notes", error:err})
    }
  }
};