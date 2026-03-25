const { EmbedBuilder } = require('discord.js');

module.exports = async function (client, user){
    const notes = await client.DB.Notes.findAll({
        where: {
            User: user
        },
        order: [ ['Date', 'DESC']],
        limit: 5
    });
    client.log.debug(`${notes.length} notes retrieved`);

    const member = await client.users.fetch(user);
   
    const noteEmbed = new EmbedBuilder()
        .setColor(0xffff88)
        .setAuthor({ name: member.displayName, iconURL: member.displayAvatarURL()})
        .setFooter({ text: `${notes.length} total notes` });

    for (var note of notes){
        var noterId = String(note.Noter);
        var noter = await client.users.fetch(noterId);

        var link = note.Link;
        if(note.Link != "N/A"){
            link = `\n\n[Link to message](${link})`;
        } else {
            link = "";
        }
        var noteText = note.Note + link;
        noteEmbed.addFields({
            'name': `Note ${note.ID}: Submitted by ${noter.displayName} <t:${note.Date}:R>\n${note.Severity} severity`,
            value: noteText
        });
    }
    return new Promise(resolve => resolve(noteEmbed));
}