#import needed modules
import discord
import datetime
import os
from threading import Timer
from include import config
from pymongo import MongoClient
from time import time, sleep
from threading import Timer

client = discord.Client() #Discord Client Object
try:
    mclient = MongoClient("mongodb://localhost:27017/") #mongoclient object
except:
    print("Could not connect")
    quit()

def restart(): #restart
    os.system('/bots/sacarver/bashscripts/restartlog.sh')
restartT = Timer(172800.0, restart)

db = mclient.messagetrends #Open/Create mongo database
sdb = mclient.stafftrends #Open/Create Mongo database for stafflogs

#Open/Create Documents in database
messagedb = db.messages
channeldb = db.channel
joindb = db.joins
leavedb = db.leave
userdb = db.users
editdb = db.edited
deletedb = db.deleted
nicknamedb = db.nicknames

#Open/Create Documents in staff database
Smessagedb = sdb.messages
Schanneldb = sdb.channel
Seditdb = sdb.edited
Sdeletedb = sdb.deleted
Snicknamedb = sdb.nicknames


@client.event
async def on_message(message):
    if message.content.startswith("$usersdb") and message.author.id == "207129652345438211":
        await client.send_message(message.channel,"Rebuilding User Database")
        userdb.drop()
        server = client.get_server(config.serverid)
        for member in server.members:
            userentry = {
                "time" : int(member.joined_at.timestamp()),
                "id" : member.id,
                "name" : member.name + str(member.discriminator),
                "created" : member.created_at
            }
            insert = userdb.insert_one(userentry)
    if message.author.id not in config.botids:
        messageentry = {
            "time" : int(message.timestamp.timestamp()),
            "authorid" : message.author.id,
            "channel" : message.channel.id,
            "messageid" : message.id
        }
        if message.channel.id not in config.staffchannels and message.channel.id not in config.infochannels:
            insert = messagedb.insert_one(messageentry)
        elif message.channel.id in config.staffchannels:
            insert = Smessagedb.insert_one(messageentry)

@client.event
async def on_message_edit(before,after):
    message = after
    if message.author.id not in config.botids:
        messageentry = {
            "time" : int(message.edited_timestamp.timestamp()),
            "authorid" : message.author.id,
            "channel" : message.channel.id,
            "messageid" : message.id
        }
        if message.channel.id not in config.staffchannels and message.channel.id not in config.infochannels:
            insert = editdb.insert_one(messageentry)
        elif message.channel.id in config.staffchannels:
            insert = Seditdb.insert_one(messageentry)

@client.event
async def on_message_delete(message):
    if message.author.id not in config.botids:
        if message.channel.id not in config.staffchannels and message.channel.id not in config.infochannels:
            messageentry = {
                "time" : int(time()),
                "authorid" : message.author.id,
                "channel" : message.channel.id,
                "messageid" : message.id
            }
            insert = deletedb.insert_one(messageentry)
        elif message.channel.id in config.staffchannels:
            messageentry = {
                "time" : int(time()),
                "authorid" : message.author.id,
                "channel" : message.channel.id,
                "messageid" : message.id
            }
            insert = Sdeletedb.insert_one(messageentry)

@client.event
async def on_member_join(member):
    userentry = {
        "time" : int(member.joined_at.timestamp()),
        "id" : member.id,
        "name" : member.name + str(member.discriminator),
        "created" : member.created_at
    }
    insert = joindb.insert_one(userentry)
    insert2 = userdb.insert_one(userentry)

@client.event
async def on_member_remove(member):
    userentry = {
        "time" : int(time()),
        "id" : member.id,
        "name" : member.name + str(member.discriminator),
        "created" : member.created_at
    }
    insert = leavedb.insert_one(userentry)
    delete = userdb.delete_one({"id":member.id})

@client.event
async def on_member_update(before,after):
    server = client.get_server(config.serverid)
    staff = discord.utils.get(server.roles, id=config.roles['staff'])

    if before.nick != after.nick:
        userentry = {
            "time" : int(time()),
            "id" : after.id,
            "name" : after.display_name,
        }
        if staff in after.roles:
            insert = Snicknamedb.insert_one(userentry)
        else:
            insert = nicknamedb.insert_one(userentry)

@client.event
async def on_ready():
    testchannel = client.get_channel(config.channels['testchannel'])
    #Acknowledge that it's online
    print('Logged in')
    await client.send_message(testchannel,"Logging bot is online")
    restartT.start()

client.run(config.bottoken) #run the bot
