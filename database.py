#import needed modules
import discord
import datetime
import os
import pymysql.cursors
from threading import Timer
from include import config, utilities
from time import time, sleep
from threading import Timer

client = discord.Client() #Discord Client Object
try:
    mysqldb = pymysql.connect(host=config.mysqlcreds["host"],
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor) #mongoclient object
except:
    print("Could not connect")
    quit()

def restart(): #restart
    mysqldb.close()
    os.system('/bots/sacarver/bashscripts/restartlog.sh')
restartT = Timer(172800.0, restart)



@client.event
async def on_message(message):

    if message.content.startswith("$logping"): #ping command
        msg = await client.send_message(message.channel,"Bot is Up!") #reply
        await client.edit_message(msg ,"Pong! `{}ms`".format(utilities.msdiff(message.timestamp,msg.timestamp)))

    if message.content.startswith("$rebuildusers") and message.author.id == "207129652345438211": #rebuild user table
        await client.send_message(message.channel,"Rebuilding User Database")
        server = client.get_server(config.serverid)
        with mysqldb.cursor() as cursor:
            sql = "DELETE FROM users"
            cursor.execute(sql)
        mysqldb.commit()
        for member in server.members:
            userentry = {
                "time" : int(member.joined_at.timestamp()),
                "id" :str(member.id),
                "name" : member.name + str(member.discriminator),
                "created" : str(member.created_at)
            }
            with mysqldb.cursor() as cursor:
                sql2 = "INSERT INTO users (id,name,jointime,created) VALUES ({},{},{},{})".format(userentry['id'],userentry['name'],userentry['time'],userentry['created'])
                cursor.execute(sql)
        mysqldb.commit()
        await client.send_message(message.channel,"Done!")

    if message.author.id not in config.botids: #actual logging
        messageentry = { #messageinfo
            "time" : int(message.timestamp.timestamp()),
            "authorid" : str(message.author.id),
            "channel" : str(message.channel.id),
            "messageid" : str(message.id)
        }

        with mysqldb.cursor() as cursor: #insert record
            sql = "INSERT INTO messages (messageid,time,author,channel) VALUES ({},{},{},{})".format(messageentry['messageid'],messageentry['time'],messageentry['authorid'],messageentry['channel'])
            cursor.execute(sql)

        mysqldb.commit() #commit

@client.event
async def on_message_edit(before,after):
    if after.author.id not in config.botids:
        messageentry = { #messageinfo
            "time" : int(after.edited_timestamp.timestamp()),
            "authorid" : str(after.author.id),
            "channel" : str(after.channel.id),
            "messageid" : str(after.id)
        }

        with mysqldb.cursor() as cursor: #insert
            sql = "INSERT INTO edited (messageid,time,author,channel) VALUES ({},{},{},{})".format(messageentry['messageid'],messageentry['time'],messageentry['authorid'],messageentry['channel'])
            cursor.execute(sql)

        mysqldb.commit() #commit

@client.event
async def on_message_delete(message):
    if message.author.id not in config.botids:
        messageentry = { #messageinfo
            "time" : int(time()),
            "authorid" : str(message.author.id),
            "channel" : str(message.channel.id),
            "messageid" : str(message.id)
        }

        with mysqldb.cursor() as cursor: #insert
            sql = "INSERT INTO deleted (messageid,time,author,channel) VALUES ({},{},{},{})".format(messageentry['messageid'],messageentry['time'],messageentry['authorid'],messageentry['channel'])
            cursor.execute(sql)

        mysqldb.commit()#commit

@client.event
async def on_member_join(member):
    userentry = {#user info
        "time" : int(member.joined_at.timestamp()),
        "id" : str(member.id),
        "name" : str(member.name + str(member.discriminator)),
        "created" : str(member.created_at)
    }

    with mysqldb.cursor() as cursor: #insert
        sql = "INSERT INTO joinedusers (id,name,joined) VALUES ({},{},{})".format(userentry['id'],userentry['name'],userentry['time'])
        sql2 = "INSERT INTO users (id,name,jointime,created) VALUES ({},{},{},{})".format(userentry['id'],userentry['name'],userentry['time'],userentry['created'])
        cursor.execute(sql)
        cursor.execute(sql2)
    mysqldb.commit() #commit

@client.event
async def on_member_remove(member):
    userentry = { #user info
        "time" : int(time()),
        "id" : str(member.id),
        "name" : member.name + str(member.discriminator)
    }

    with mysqldb.cursor() as cursor: #insert
        sql = "INSERT INTO leftusers (id,name,left) VALUES ({},{},{})".format(userentry['id'],userentry['name'],userentry['time'])
        sql2 = "DELETE FROM users where id = {}".format(userentry["id"])
        cursor.execute(sql)
        cursor.execute(sql2)
    mysqldb.commit()#commit

@client.event
async def on_member_update(before,after):
    server = client.get_server(config.serverid)

    if before.nick != after.nick:
        userentry = {
            "time" : int(time()),
            "id" : str(after.id)
        }
        with mysqldb.cursor() as cursor:
            sql = "INSERT INTO nicknames ('id','time') VALUES ({},{})".format(userentry['id'],userentry['time'])
            cursor.execute(sql)
        mysqldb.commit()

@client.event
async def on_ready():
    testchannel = client.get_channel(config.channels['testchannel'])
    #Acknowledge that it's online
    print('Logged in')
    await client.send_message(testchannel,"Logging bot is online")
    restartT.start()

client.run(config.bottoken) #run the bot
