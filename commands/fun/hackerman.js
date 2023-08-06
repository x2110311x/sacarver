const { EmbedBuilder } = require('discord.js');


var answerList = [
  "Overriding the panel won't do anything, we need to calculate the bluetooth SSL monitor!",
  "Try to program the IB interface, maybe it will synthesize the solid state program!",
  "We need to synthesize the bluetooth SMS interface!",
  "Use the wireless ADP bus, then you can bypass the digital interface!",
  "If we connect the program, we can get to the JSON transmitter through the haptic EXE firewall!",
  "We need to hack the multi-byte SSL driver!",
  "You can't program the pixel without bypassing the 1080p SCSI bus!",
  "Try to transmit the XML program, maybe it will input the cross-platform program!",
  "Use the optical SDD bus, then you can bypass the wireless bandwidth!",
  "Try to reboot the FTP interface, maybe it will quantify the solid state hard drive!",
  "If we quantify the sensor, we can get to the PNG application through the bluetooth EXE driver!",
  "I'll navigate the mobile XML card, that should panel the EXE hard drive!",
  "The JSON sensor is down, program the open-source card so we can reboot the XSS card!",
  "Try to compress the AGP bandwidth, maybe it will compress the multi-byte circuit!",
  "Use the digital USB system, then you can synthesize the primary port!",
  "We need to override the open-source TCP hard drive!",
  "Use the open-source GB bus, then you can hack the wireless system!",
  "I'll navigate the optical XSS transmitter, that should matrix the PCI alarm!",
  "I'll index the online SMS transmitter, that should hard drive the IB matrix!",
  "The AI bus is down, quantify the back-end panel so we can calculate the XSS circuit!",
  "You can't transmit the microchip without compressing the virtual USB panel!",
  "Synthesizing the program won't do anything, we need to override the digital RSS array!",
  "If we back up the bus, we can get to the GB driver through the redundant XML firewall!",
  "Try to program the COM hard drive, maybe it will index the optical hard drive!",
  "We need to index the cross-platform XML circuit!",
  "The ADP firewall is down, calculate the wireless bandwidth so we can navigate the USB bandwidth!",
  "We need to index the cross-platform XML circuit!",
  "The JSON card is down, override the virtual card so we can generate the AGP program!",
  "If we reboot the feed, we can get to the ADP interface through the wireless SQL array!",
  "I'll quantify the primary XML alarm, that should program the SSL monitor!",
  "Parsing the driver won't do anything, we need to transmit the virtual AI feed!",
  "Try to back up the ADP bus, maybe it will copy the online feed!",
  "The JSON alarm is down, navigate the online interface so we can reboot the PCI system!",
  "Try to input the SDD sensor, maybe it will connect the cross-platform protocol!",
  "You can't copy the bus without calculating the primary SAS protocol!",
  "The SAS feed is down, input the open-source pixel so we can transmit the PCI interface!",
  "We need to connect the bluetooth SDD matrix!",
  "If we compress the firewall, we can get to the SMTP sensor through the cross-platform TCP hard drive!",
  "We need to connect the optical SMS array!",
  "If we reboot the pixel, we can get to the XML interface through the back-end SSL panel!",
  "You can't compress the matrix without transmitting the bluetooth FTP firewall!",
  "We need to quantify the virtual TCP transmitter!",
  "We need to input the neural XML microchip!",
  "The SAS feed is down, input the open-source pixel so we can transmit the PCI interface!",
  "The COM monitor is down, reboot the virtual driver so we can compress the RSS card!",
  "Try to navigate the HDD program, maybe it will input the optical bandwidth!",
  "The JBOD monitor is down, transmit the 1080p interface so we can connect the SCSI feed!",
  "I'll override the haptic SDD monitor, that should transmitter the USB bandwidth!",
  "You can't compress the firewall without generating the cross-platform JBOD interface!",
  "I was able to triangulate the cell phone signal and trace the caller.",
  "Using an RX modulator, I might be able to conduct a mainframe cell direct and hack the uplink to the download."
];

module.exports = {
  builder: function (SlashCommandBuilder){
      SlashCommandBuilder.addSubcommand(subcommand =>
          subcommand
              .setName('hackerman')
              .setDescription('Generate a hackerman quote'));
      return SlashCommandBuilder;
  },
  execute: async function(interaction){
    let answer = answerList[Math.floor(Math.random() * answerList.length)];

    const hackermanEmbed = new EmbedBuilder()
      .setColor(0x493388)
      .setTitle(answer)
      .setThumbnail('https://c.tenor.com/H15IIZOPbMwAAAAd/hackerman-mr.gif')
      .setFooter({ text: '© 2022 x2110311x', iconURL: 'https://cdn.discordapp.com/avatars/470691679712706570/42e790b8113e7f21422796db72d652f2.webp?size=1024' });

    await interaction.reply({ embeds: [hackermanEmbed] });
  }
};