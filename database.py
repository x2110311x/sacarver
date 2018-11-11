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
            jointime = int(member.joined_at.timestamp())
            userid = str(member.id)
            username = str(member.name + "#" + str(member.discriminator))
            created = str(int(member.created_at.timestamp()))

            with mysqldb.cursor() as cursor:
                sql = "INSERT INTO users (id,name,created,jointime) VALUES (%s,%s,%s,%s)"
                cursor.execute(sql, (userid,username,created,jointime))
            mysqldb.commit()
        await client.send_message(message.channel,"Done!")

    if message.author.id not in config.botids: #actual logging
        msgtime = int(message.timestamp.timestamp())
        authorid = str(message.author.id)
        channelid = str(message.channel.id)
        messageid = str(message.id)


        with mysqldb.cursor() as cursor: #insert record
            sql = "INSERT INTO messages (messageid,time,author,channel) VALUES (%s,%s,%s,%s)"
            cursor.execute(sql,(messageid,msgtime,authorid,channelid))
        mysqldb.commit() #commit

@client.event
async def on_message_edit(before,after):
    if after.author.id not in config.botids:
        msgtime = int(message.timestamp.timestamp())
        authorid = str(message.author.id)
        channelid = str(message.channel.id)
        messageid = str(message.id)


        with mysqldb.cursor() as cursor: #insert record
            sql = "INSERT INTO edited (messageid,time,author,channel) VALUES (%s,%s,%s,%s)"
            cursor.execute(sql,(messageid,msgtime,authorid,channelid))

        mysqldb.commit() #commit

@client.event
async def on_message_delete(message):
    if message.author.id not in config.botids:
        msgtime = int(message.timestamp.timestamp())
        authorid = str(message.author.id)
        channelid = str(message.channel.id)
        messageid = str(message.id)


        with mysqldb.cursor() as cursor: #insert record
            sql = "INSERT INTO deleted (messageid,time,author,channel) VALUES (%s,%s,%s,%s)"
            cursor.execute(sql,(messageid,msgtime,authorid,channelid))

        mysqldb.commit()#commit

@client.event
async def on_member_join(member):
    jointime = int(member.joined_at.timestamp())
    userid = str(member.id)
    username = str(member.name + str(member.discriminator))
    created = str(member.created_at.timestamp())

    with mysqldb.cursor() as cursor: #insert
        sql = "INSERT INTO joinedusers (id,name,joined) VALUES (%s,%s,%s)"
        cursor.execute(sql,(userid,username,jointime))
        sql2 = "INSERT INTO users (id,name,jointime,created) VALUES (%s,%s,%s,%s)"
        cursor.execute(sql2,(userid,username,jointime,created))
    mysqldb.commit() #commit

@client.event
async def on_member_remove(member):
    leavetime = int(member.joined_at.timestamp())
    userid = str(member.id)
    username = str(member.name + "#"  + member.discriminator)
    created = str(member.created_at.timestamp())

    with mysqldb.cursor() as cursor: #insert
        sql2 = "DELETE FROM users where id = {}".format(userentry["id"])
        sql = "INSERT INTO leftusers (id,name,joined) VALUES (%s,%s,%s)"
        cursor.execute(sql,(userid,username,jointime))
        cursor.execute(sql2)
    mysqldb.commit()#commit

@client.event
async def on_member_update(before,after):
    server = client.get_server(config.serverid)

    if before.nick != after.nick:
        nicktime = int(time())
        userid = str(after.id)
        with mysqldb.cursor() as cursor:
            sql = "INSERT INTO nicknames ('id','time') VALUES (%s,%s)"
            cursor.execute(sql,(userid,nicktime))
        mysqldb.commit()

@client.event
async def on_ready():
    testchannel = client.get_channel(config.channels['testchannel'])
    #Acknowledge that it's online
    print('Logged in')
    await client.send_message(testchannel,"Logging bot is online")
    restartT.start()

client.run(config.bottoken) #run the bot
