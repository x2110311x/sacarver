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

        const member = await client.users.fetch(user);
        console.log(member.displayName);
        console.log(member.displayAvatarURL());
        
        const noteEmbed = new EmbedBuilder()
            .setColor(0xffff88)
            .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
            .setFooter({ text: `${notes.length} total notes` });

        for (var note of notes){
            var noterId = String(note.Noter);
            console.log(noterId);
            var noter = await client.users.fetch(noterId);
            console.log(noter.displayName);

            var link = note.Link;
            if(note.Link != "N/A"){
                link = `\n\n[Link to message](${link})`;
            } else {
                link = "";
            }
            var noteText = note.Note + link;

            noteEmbed.addFields({
                'name': `Note ${note.ID}:${note.Severity} severity. Submitted by ${noter.displayName} on <t:${note.Date}:F>`,
                value: noteText
            });
        }

        client.log.debug(noteEmbed.data);

        await interaction.editReply({embeds: [noteEmbed]});
    } catch (err){
        console.log(err);
        client.log.error({message: "Error retrieving staff notes", error:err})
    }
  }
};