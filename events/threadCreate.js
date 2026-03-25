const Sacarver = require("../structures/bot");
const client = Sacarver.getInstance().client;
const fetchNotes = require("../helpers/notes/fetchnotes");

module.exports = {
	name: 'threadCreate',
	once: false,
	async execute(thread, newlycreated) {
        await thread.join();
        if (thread.parentId == client.config.channels.tbApps){
            client.log.info(`Joined new TB App thread ${thread.name} (${thread.id})`);
            let message = await thread.fetchStarterMessage();
            let member = message.mentions.users.first();
            let userId = member.id;
            await fetchNotes(client, userId).then(async (noteEmbed) => {
                await thread.send({embeds: [noteEmbed]});
            });
            
        }
}
};