import discord
import os
from include import config
from threading import Timer

client = discord.Client()
def restart(): #restart
    os.system('/bots/sacarver/bashscripts/restart.sh')
    os.system('/bots/sacarver/bashscripts/restartupdater.sh')

restartT = Timer(43200.0, restart)

def update(): #update bot
    os.system('/bots/sacarver/bashscripts/update.sh')
    restart()

@client.event
async def on_message(message):
    server = client.get_server(config.serverid)
    staff = discord.utils.get(server.roles, id=config.roles['staff'])

    if message.content.startswith("$restartbot") and staff in message.author.roles:
        await client.send_message(message.channel,"***BOT IS RESTARTING***")
        restart()

    if message.content.startswith("$updatebot") and staff in messsage.author.roles:
        await client.send_message(message.channel,"***BOT IS UPDATING***")
        update()

@client.event
async def on_ready():
    testchannel = client.get_channel(config.channels['testchannel'])

    #Acknowledge that it's online
    print('Logged in')
    await client.send_message(testchannel,"Bot restarter/updater online")
    restartT.start()

client.run(config.bottoken) #run the bot
