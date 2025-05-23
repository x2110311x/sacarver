const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle } = require('discord.js');
const crypto = require("crypto");

async function catchModal(interaction, newInteraction, noteID){
    let client = interaction.client;
    var originalnote = interaction.note;
  
    var severity = originalnote.Severity;
    var user = originalnote.User;
    var note = newInteraction.fields.getTextInputValue('note');
    const msgLink = newInteraction.fields.getTextInputValue('link');
    const editor = interaction.member.id;
    const dateEdited = Math.floor(newInteraction.createdTimestamp/1000);

    note += `\nEdited by <@${editor}> on <t:${dateEdited}:F>`

    var data = {
      "user": user,
      "severity": severity,
      "note": note,
      "msgLink": msgLink,
      "dateAdded": Math.floor(newInteraction.createdTimestamp/1000),
      "noter": interaction.member.id,
      "ID": noteID
    }
    
    const noteEmbed = new EmbedBuilder()
    .setColor(0xffff88)
    .setTitle("Edited Staff Note")
    .setDescription("Please review, and then click Submit or Cancel")
    .addFields(
      { name: 'User', value: `<@${user}> - ${user}` },
      { name: 'Note', value: `${note}`},
      { name: 'Severity', value: `${severity}`},
      { name: 'Message Link', value: `${msgLink}` },
      { name: 'Date Originally Added', value: `<t:${originalnote.Date}:F>`},
    )
    .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
  
    const submitButton = new ButtonBuilder()
      .setCustomId('submit')
      .setLabel("Submit")
      .setStyle(ButtonStyle.Success);
    
    // eslint-disable-next-line no-unused-vars
    const editButton = new ButtonBuilder()
      .setCustomId('edit')
      .setLabel("Edit")
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary);
  
    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel')
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary);
  
    const buttonRow = new ActionRowBuilder()
      .addComponents(submitButton, editButton, cancelButton); 
  
    let response = await newInteraction.reply({ephemeral:true, embeds: [noteEmbed], components: [buttonRow], fetchReply: true});  
  
    const collectorFilter = i => 
      (i.user.id === interaction.user.id && 
        (i.customId === "edit" || i.customId === "cancel" || i.customId === "submit" ));
    
      await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
        .then(i=> {
          catchButton(newInteraction, i, data);
        }).catch(err => {
        interaction.client.log.warn({message: `Error with button response for /staff note edit`, error:err});
      });
}
  
async function catchButton(interaction, newInteraction, data) {
    let client = interaction.client;

    await newInteraction.update({components:[]});

    if (newInteraction.customId == 'submit'){
        await submitNote(interaction, data);
    } else if (newInteraction.customId == 'edit'){
        await newInteraction.reply({ephemeral: true, content: "This feature has not been implemented yet"});
    } else if (newInteraction.customId == 'cancel'){
        let cancelEmbed = new EmbedBuilder()
        .setTitle("Note cancelled")
        .setDescription("Note edit has been cancelled")
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        await newInteraction.reply({ephemeral: true, embeds:[cancelEmbed]});
    } else {
        let errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Command Error")
            .setDescription("Something went very wrong")
            .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        
        
        interaction.client.error(`Received unknown button ID ${newInteraction.customId} in /staff note edit`);
        
        
        await newInteraction.reply({ephemeral: true, embeds:[errorEmbed]})
    }
}

async function submitNote(interaction, data) {
    let client = interaction.client;
    let DB = client.DB;

    try{
        await DB.Notes.update(
            { 
                "Note": data.note,
                "Link": data.msgLink
            },
            { where: { ID: data.ID } }
        );

        client.log.info("Edited note in database");
    } catch (err){
        console.log(err);

        client.log.error({message: "Failed to update note in database", error: err})
        let errorEmbed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle("Command Error")
            .setDescription("Something went very wrong")
            .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });
        await interaction.editReply({embeds: [errorEmbed]});
        return;
    }


        
    let submitEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("Note edited")
        .setDescription("Your note has been updated!")
        .addFields(
        { name: 'User', value: `<@${data.user}> - ${data.user}` },
        { name: 'Note', value: `${data.note}`},
        { name: 'Severity', value: `${data.severity}`},
        { name: 'Message Link', value: `${data.msgLink}` },
        { name: 'Date Added', value: `<t:${data.dateAdded}:F>`},
        { name: 'Added by', value: `<@${data.noter}>`},
        )
        .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

        await interaction.deleteReply();
        await interaction.followUp({embeds: [submitEmbed]});

}

async function sendModal(interaction, noteID){
    var note = interaction.note;
    const modalID = crypto.randomBytes(16).toString("hex");
    const modal = new ModalBuilder()
        .setCustomId(modalID)
        .setTitle("Edit note details");

    const noteInput = new TextInputBuilder()
        .setCustomId('note')
        .setLabel("Note")
        .setRequired(true)
        .setValue(note.Note)
        .setMaxLength(1_000)
        .setStyle(TextInputStyle.Paragraph);
    
    const messageLinkInput = new TextInputBuilder()
        .setCustomId('link')
        .setLabel("Message Link")
        .setValue(note.Link)
        .setRequired(false)
        .setMaxLength(200)
        .setStyle(TextInputStyle.Short);

    const firstActionRow = new ActionRowBuilder().addComponents(noteInput);
    const secondActionRow = new ActionRowBuilder().addComponents(messageLinkInput);

    modal.addComponents(firstActionRow, secondActionRow);
    await interaction.showModal(modal);

    const collectorFilter = i => (i.user.id === interaction.user.id && i.customId === modalID);

    interaction.awaitModalSubmit({ time: 600_000, collectorFilter })
    .then(i => {
      catchModal(interaction, i, noteID);
    }).catch(err => {
        interaction.client.log.warn({message: `Error with modal response for /staff note edit`, error:err});
    });
}

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('edit')
              .setDescription('Edit a staff note')
              .addIntegerOption(option =>
                  option.setName('noteid')
                      .setDescription('The ID of the note you wish to edit')
                      .setMinValue(0)
                      .setRequired(true)));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const client = interaction.client;

    var noteID = interaction.options.getInteger('noteid');
    try{
        const note = await client.DB.Notes.findOne({
            where: {
                ID: noteID
            }
        });
        interaction.note = note;
    }
    catch (err) {
        interaction.client.log.error({message: `Error fetching note for /staff note edit`, error:err});
        await interaction.reply({ephemeral: true, content: "There was an error fetching the note"});
        return;
    }

    await sendModal(interaction, noteID);
    
    }
};
