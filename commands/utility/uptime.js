const { EmbedBuilder } = require("discord.js");

module.exports = {
    builder: function (SlashCommandBuilder){
        SlashCommandBuilder.addSubcommand(subcommand =>
            subcommand
                .setName('uptime')
                .setDescription('Get the bots uptime since last restart.'));
        return SlashCommandBuilder;
    },
    execute: async function(interaction){
      var uptimeStr = getTimeDifference(interaction.client.startTime);
        const uptime = new EmbedBuilder()
            .setColor(0xd5b052)
            .setTitle(`The bot has been online for \`${uptimeStr}\`.`)
            .setFooter({ text: '© 2025x2110311x', iconURL: interaction.client.user.avatarURL() });
        
        await interaction.reply({embeds: [uptime]});
    }
};

function getTimeDifference(startTime){
  var start = startTime.getTime();
  var now = new Date().getTime();
  var seconds = (now-start)/1000;
  var numdays = Math.floor((seconds % 31536000) / 86400); 
  var numhours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  var numminutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  var numseconds = Math.floor((((seconds % 31536000) % 86400) % 3600) % 60);
  var returnString = "";
  if (numdays > 0) returnString += numdays + " days ";
  if (numhours > 0) returnString += numhours + " hours ";
  if (numminutes > 0) returnString += numminutes + " minutes ";
  if (numseconds > 0) returnString += numseconds + " seconds";
  return returnString;
}