const { SlashCommandBuilder, EmbedBuilder } = require('@discordjs/builders');
const sleep = ms => new Promise(r => setTimeout(r, ms));

let staffCommand = new SlashCommandBuilder()
  .setName('redeem')
  .setDescription('Redeem a secret halloween code')
  .addStringOption(option =>
    option
      .setName('code')
      .setDescription('The code to redeem')
      .setRequired(true));


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
    console.log(row);
    codes.push(row.Code);
  });
  await sleep(300);
  console.log(codes);

  var found = codes.length;
  if(codes.includes(code)){
    embed = new EmbedBuilder()
    .setTitle("Silly you!")
    .setDescription(`You've already redeemed this code!!\n\`${(interaction.client.codes.length - found)}\` codes still remain`)
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
      .setTitle("CONGRATULATIONS")
      .setDescription("You have found all the codes! Enjoy your new role!")
      .setColor(0xff9300)
      .setFooter({
        text: "Sacarver - © 2024 x2110311x",
        iconURL: interaction.client.icon,
      });
      //let role = await interaction.guild.roles.fetch('role id');
      //await interaction.member.roles.add(role);

    } else {
      embed = new EmbedBuilder()
      .setTitle("Good job!")
      .setDescription(`You successfully found a code!\n\`${(interaction.client.codes.length - found)}\` codes remain`)
      .setColor(0xff9300)
      .setFooter({
        text: "Sacarver - © 2024 x2110311x",
        iconURL: interaction.client.icon,
      });
    }
  }
  

  await interaction.reply({ephemeral: true, embeds: [embed]});

  if(newCode){
        db.run(
      `INSERT INTO Users (User, Code) VALUES (?, ?)`,
      [member, code],
      function (error) {
        if (error) {
          console.error(error.message);
        }
        console.log(`Inserted a row with the ID: ${this.lastID}`);
      }
    );
  }

}

async function invalidCode(interaction, code){
  const embed = new EmbedBuilder()
  .setTitle("Womp womp")
  .setDescription("That's not even a code?? \nWhere did you find that?")
  .setColor(0xff9300)
  .setFooter({
    text: "Sacarver - © 2024 x2110311x",
    iconURL: interaction.client.icon,
  })
  
  await interaction.reply({ephemeral: false, embeds: [embed]});
}


module.exports = {
	data: staffCommand,
    async execute(interaction) {
        const code = interaction.options.getString('code') ?? '';
        if (interaction.client.codes.includes(code)){
          await validCode(interaction, code);
        } else {
          await invalidCode(interaction, code);
        }
	},
};