const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const sleep = ms => new Promise(r => setTimeout(r, ms));

let staffCommand = new SlashCommandBuilder()
  .setName('redeem')
  .setDescription('Redeem a secret halloween code')
  .addStringOption(option =>
    option
      .setName('code')
      .setDescription('The code to redeem. Leave blank to see how many codes you have left.')
      .setRequired(false));

async function getCodeCount(interaction){
  let db = interaction.client.db;
  var member = String(interaction.member.id);
  var embed;
  var codes = [];

  db.each(`SELECT * FROM Users WHERE User = '${member}'`, (error, row) => {
    if (error) {
      throw new Error(error.message);
    }
    codes.push(row.Code);
  });
  await sleep(300);
  var found = codes.length;
  embed = new EmbedBuilder()
    .setTitle("Progress:")
    .setDescription(`You have found \`${found} codes\`.\n\`${(interaction.client.codes.length - found)} codes\` remain`)
    .setColor(0xff9300)
    .setFooter({
      text: "Sacarver - © 2024 x2110311x",
      iconURL: interaction.client.icon,
    });
await interaction.editReply({ephemeral: true, embeds: [embed]});

}

async function validCode(interaction, code){
  let db = interaction.client.db;
  var member = String(interaction.member.id);
  var embed;
  var codes = [];
  var newCode = false;
  var completed = false;

  db.each(`SELECT * FROM Users WHERE User = '${member}'`, (error, row) => {
    if (error) {
      throw new Error(error.message);
    }
    codes.push(row.Code);
  });
  await sleep(300);

  var found = codes.length;
  if(codes.includes(code)){
    embed = new EmbedBuilder()
    .setTitle("Silly you!")
    .setDescription(`You've already redeemed this code!!\n\`${(interaction.client.codes.length - found)} codes\` still remain`)
    .setColor(0xff9300)
    .setFooter({
      text: "Sacarver - © 2024 x2110311x",
      iconURL: interaction.client.icon,
    });

  } else {
    newCode = true;
    found += 1;
    completed = (found == interaction.client.codes.length);
    if(completed){
      embed = new EmbedBuilder()
      .setTitle("A frightful victory!")
      .setDescription("Congratulations, citizen - you've finished the Spooky Codebreaker Event and won a special role!")
      .setColor(0xff9300)
      .setFooter({
        text: "Sacarver - © 2024 x2110311x",
        iconURL: interaction.client.icon,
      });
      let role = await interaction.guild.roles.fetch('1282005363499208776');
      await interaction.member.roles.add(role);

    } else {
      embed = new EmbedBuilder()
      .setTitle("Good job!")
      .setDescription(`You successfully found a code!\n\`${(interaction.client.codes.length - found)} codes\` remain`)
      .setColor(0xff9300)
      .setFooter({
        text: "Sacarver - © 2024 x2110311x",
        iconURL: interaction.client.icon,
      });
    }
  }
  

  await interaction.editReply({ephemeral: true, embeds: [embed]});

  if(newCode){
        db.run(
      `INSERT INTO Users (User, Code) VALUES (?, ?)`,
      [member, code],
      function (error) {
        if (error) {
          console.error(error.message);
        }
      }
    );
  }

}

async function invalidCode(interaction, code){
  const embed = new EmbedBuilder()
  .setTitle("Not spooky at all!")
  .setDescription("Boo! That's not one of our codes.\nChannel a bit more of the Halloween spirit and try again.")
  .setColor(0xff9300)
  .setFooter({
    text: "Sacarver - © 2024 x2110311x",
    iconURL: interaction.client.icon,
  })
  
  await interaction.editReply({ephemeral: false, embeds: [embed]});
}


module.exports = {
	data: staffCommand,
    async execute(interaction) {
        const code = interaction.options.getString('code') ?? '';
        if(code == ''){
          await interaction.deferReply({ ephemeral: true });
          await getCodeCount(interaction);
        } else {
          if (interaction.client.codes.includes(code)){
            await interaction.deferReply({ ephemeral: true });
            await validCode(interaction, code);
          } else {
            await interaction.deferReply();
            await invalidCode(interaction, code);
          }
        }
	},
};