const { EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('add')
              .setDescription('Add a note to a user')
              .addStringOption(option => 
                option.setName('severity')
                       .setDescription('The severity of the note')
                       .setRequired(true)
                       .addChoices(
                        { name: 'High', value: 'High' },
                        { name: 'Medium', value: 'Medium' },
                        { name: 'Low', value: 'Low' },
                      )
              )
              .addUserOption(option =>
                option.setName('user')
                    .setDescription('The user to add a note to, if they are in the server')
                    .setRequired(false))
              .addStringOption(option =>
                  option.setName('userid')
                      .setDescription('The ID of the user to add a note to, if they are not in the server')
                      .setRequired(false))
      );
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    const client = interaction.client;

    var severity = interaction.options.getString('severity');
    var user = interaction.options.getUser('user');
    if (user == null){
        user = interaction.options.getString('userid');
        if (user == null){
          let errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Command Error")
          .setDescription("Please specify a user or user ID")
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

          await interaction.reply({ephemeral: true, embeds: [errorEmbed]});
          return;
        }
    } else {
      user = user.id;
    }


    const modalID = crypto.randomBytes(16).toString("hex");
    const modal = new ModalBuilder()
      .setCustomId(modalID)
      .setTitle("Enter note details");

    const noteInput = new TextInputBuilder()
      .setCustomId('note')
      .setLabel("Note")
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);
    
      const messageLinkInput = new TextInputBuilder()
        .setCustomId('link')
        .setLabel("Message Link")
        .setValue("N/A")
        .setRequired(false)
        .setStyle(TextInputStyle.Paragraph);

      const firstActionRow = new ActionRowBuilder().addComponents(noteInput);
      const secondActionRow = new ActionRowBuilder().addComponents(messageLinkInput);

      modal.addComponents(firstActionRow, secondActionRow);
      await interaction.showModal(modal);

      const collectorFilter = i => (i.user.id === interaction.user.id && i.customId === modalID);

      interaction.awaitModalSubmit({ time: 60_000, collectorFilter })
        .then(i => {
          const note = i.fields.getTextInputValue('note');
          const msgLink = i.fields.getTextInputValue('link');
          
          const noteEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("Note added")
          .setDescription("NOTE: This is a test, and the note is not actually stored yet")
          .addFields(
            { name: 'User', value: `<@${user}> - ${user}` },
            { name: 'Note', value: `${note}`},
            { name: 'Severity', value: `${severity}`},
            { name: 'Message Link', value: `${msgLink}` },
            { name: 'Date Added', value: `<t:${Math.floor(i.createdTimestamp/1000)}:F>`},
          )
          .setFooter({ text: `© ${new Date().getFullYear()} x2110311x`, iconURL: `${client.icon}` });

          i.reply({ephemeral:true, embeds: [noteEmbed]});
        }).catch(err => {
          console.log('No modal submit interaction was collected');
        });      
  }
};