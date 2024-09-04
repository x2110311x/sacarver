import yaml
import discord
import asyncio
from time import time as curtime
from discord.ext import commands, tasks
import discord.utils
from datetime import datetime
from dateutil import parser
import io
import re
import requests
from PIL import Image
from os.path import abspath
from os import remove
from google_images_search import GoogleImagesSearch
from include import DB
from string import ascii_letters


with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

with open(abspath(config['help_file']), 'r') as helpFile:
    helpInfo = yaml.safe_load(helpFile)

helpInfo = helpInfo['Staff']

dmsesh = []
ascii_letters += ' '
ascii_letters += '@'
ascii_letters += '<'
ascii_letters += '>'
ascii_letters += ':'
ascii_letters += '/'
ascii_letters += '.'

shutdownChans = [470330055063633920,470330688235765770,470330491816509449,470380663682367488,487830419149029376,
            700107557766692864,470425013770649600,470451678294835200,641087479293935642,470331336511717376,
            470435985788764179,478970958615412746,940341308696965120,470421876976517141,940390987841302598,
            470335381766668288,470434533884297216,470335772084666389,693592071012876349,470335805697556480,
            470337020431171595,470714580935639041,536828256247218176,500492908122865664,470339161967165440,
            689322666234216456,689548218828455967]

raidmodeChans = [700107557766692864,470425013770649600,470451678294835200,641087479293935642,470331336511717376,
            470435985788764179,478970958615412746,940341308696965120,470421876976517141,940390987841302598,
            470335381766668288,470434533884297216,470335772084666389,693592071012876349,470335805697556480,
            470337020431171595,470714580935639041,536828256247218176,500492908122865664,470339161967165440,
            689322666234216456,689548218828455967]

raidmodeLock = [470330055063633920,470330688235765770,470330491816509449,470380663682367488,487830419149029376]

async def is_owner(ctx):
    return ctx.author.id == int(config['owner'])

class SaidNoError(Exception):
    pass

class InvalidDate(Exception):
    pass

class Staff(commands.Cog, name="Staff Commands"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None
        self.dbinit = True
        self.event_reminder.start()
        #self.check_vanity.start()

    def cog_unload(self):
        self.event_reminder.cancel()
        return super().cog_unload()

    @commands.Cog.listener()
    async def on_ready(self):
        if self.dbinit:
            self.DBConn = await DB.connect()
            self.dbinit = False

    @tasks.loop(seconds=20.0)
    async def event_reminder(self):
        await self.bot.wait_until_ready()
        await asyncio.sleep(.5)
        currentTime = int(curtime())
        halfHourRemindSQL = f"SELECT ID, Title, MessageID From Events WHERE Time <= {currentTime + 1800} AND halfhour = 0"
        halfhourRemind = await DB.select_all(halfHourRemindSQL, self.DBConn)
        if len(halfhourRemind) > 0:
            for event in halfhourRemind:
                eventID = event[0]
                eventName = event[1]
                msgID = event[2]
                halfhourRemindUsersSQL = f"SELECT User FROM EventSignups WHERE Event = {eventID}"
                halfhourRemindUsers = await DB.select_all(halfhourRemindUsersSQL, self.DBConn)
                for userentry in halfhourRemindUsers:
                    user = self.bot.get_user(userentry[0])
                    try:
                        await user.send(f"Upcoming Event in 30 minutes: `{eventName}`")
                    except:
                        pass
                await DB.execute(f"UPDATE Events SET halfhour = 1 WHERE ID = {eventID}", self.DBConn)
                eventchan = self.bot.get_guild(269657133673349120).get_channel(596045539011854341)
                msg = await eventchan.fetch_message(msgID)
                embed = msg.embeds[0]
                embed.set_footer(text="Event Starting Soon")
                await msg.edit(embed=embed)
        fiveminRemindSQL = f"SELECT ID, Title, MessageID From Events WHERE Time <= {currentTime + 300} AND fivemin = 0"
        fiveminRemind = await DB.select_all(fiveminRemindSQL, self.DBConn)
        if len(fiveminRemind) > 0:
            for event in fiveminRemind:
                eventID = event[0]
                eventName = event[1]
                msgID = event[2]
                fiveminRemindUsersSQL = f"SELECT User FROM EventSignups WHERE Event = {eventID}"
                fiveminRemindUsers = await DB.select_all(fiveminRemindUsersSQL, self.DBConn)
                for userentry in fiveminRemindUsers:
                    user = self.bot.get_user(userentry[0])
                    try:
                        await user.send(f"Upcoming Event in 5 minutes: `{eventName}`")
                    except:
                        pass
                await DB.execute(f"UPDATE Events SET fivemin = 1 WHERE ID = {eventID}", self.DBConn)
                eventchan = self.bot.get_guild(269657133673349120).get_channel(596045539011854341)
                msg = await eventchan.fetch_message(msgID)
                embed = msg.embeds[0]
                embed.set_footer(text="Event Started")
                await msg.clear_reaction("📅")
                await msg.edit(embed=embed)
                ecount = await DB.select_one(f"SELECT COUNT(*) FROM EventSignups WHERE Event = {eventID}", self.DBConn)
                staffchan = self.bot.get_guild(269657133673349120).get_channel(470324442082312192)
                await staffchan.send(f"{ecount[0]} people signed up for the event")
        endedSQL = f"SELECT ID, MessageID From Events WHERE (Time+7200) <= {currentTime} AND fivemin = 1"
        ended = await DB.select_all(endedSQL, self.DBConn)
        if len(ended) > 0:
            for event in ended:
                eventID = event[0]
                msgID = event[1]
                eventchan = self.bot.get_guild(269657133673349120).get_channel(596045539011854341)
                msg = await eventchan.fetch_message(msgID)
                embed = msg.embeds[0]
                embed.set_footer(text="Event Over")
                await msg.edit(embed=embed)

                await DB.execute(f"DELETE FROM Events WHERE ID = {eventID}", self.DBConn)

    @tasks.loop(minutes=10.0)
    async def check_vanity(self):
        await self.bot.wait_until_ready()
        await asyncio.sleep(.5)
        #await self.check_vanity.stop()
        chanTest = self.bot.get_channel(config['testing_Channel'])
        await self.set_vanity_url(chanTest)

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def event_info(self, ctx, messageid = None):
        def authcheck(m):
            return m.author == ctx.message.author and m.channel == ctx.message.channel
        try:
            if messageid is None:
                await ctx.send("What is the message ID of the event signup?")
                messageID = await self.bot.wait_for('message', check=authcheck, timeout=90)
                messageid = messageID.content
            eventchan = self.bot.get_guild(269657133673349120).get_channel(596045539011854341)
            msg = await eventchan.fetch_message(messageid)
            embed = msg.embeds[0]
            embed.remove_author()
            embed.set_footer(text="")
            eventID = await DB.select_one(f"SELECT ID FROM Events WHERE MessageID = {messageid}", self.DBConn)
            eventID = eventID[0]
            ecount = await DB.select_one(f"SELECT COUNT(*) FROM EventSignups WHERE Event = {eventID}", self.DBConn)
            ecount = ecount[0]
            embed.add_field(name="Users Signed Up", value=f"{ecount} users")
            await ctx.send(embed=embed)

        except asyncio.TimeoutError:
            await ctx.send("Timeout reached. Try again later")
        except:
            await ctx.send("I was unable to fetch the event. Please check the message ID and try again")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def get_emoji(self, ctx, emoji: int):
        try:
            emojiObj = self.bot.get_emoji(emoji)
            embed=discord.Embed(title=emojiObj.name, color=0x18c446)
            embed.add_field(name="ID", value=emoji)
            embed.add_field(name="Server ID", value=emojiObj.guild_id)
            await ctx.send(embed=embed)

        except Exception as e:
            print(type(e))
            print(e)
            await ctx.send(e)
            

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def userban(self, ctx, user: int):
        member = discord.Object(user)
        try:
            await ctx.guild.ban(user=member, reason="Non-member ban with command")
            await ctx.send(f"<@{user}> has been banned by {ctx.author.mention}")
        except:
            await ctx.send("Error banning user")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def add_event(self, ctx):
        def authcheck(m):
            return m.author == ctx.message.author and m.channel == ctx.message.channel
        
        def nocheck(m):
            if authcheck(m):
                if m.content.lower() == 'yes':
                    return True
                elif m.content.lower() == 'no':
                    raise SaidNoError
                else:
                    return False
            else:
                return False
        
        await ctx.send("What is the event name?")
        try:
            eventname = await self.bot.wait_for('message', check=authcheck, timeout=90)
            await ctx.send("What is the description of the event?")
            eventdesc = await self.bot.wait_for('message', check=authcheck, timeout=90)
            await ctx.send("What is the time and date of the event (UTC)?")
            eventdate = await self.bot.wait_for('message', check=authcheck, timeout=90)
            truedate = parser.parse(eventdate.content)
            await ctx.send("Where will this event take place?")
            eventloc = await self.bot.wait_for('message', check=authcheck, timeout=90)
            embed=discord.Embed(title=eventname.content, description=eventdesc.content, color=0x18c446, timestamp=truedate)
            img = False
            try:
                await ctx.send("Do you want to add an image for this event?")
                await self.bot.wait_for('message', check=nocheck, timeout=90)
                await ctx.send("Please send the image")
                eventimg = await self.bot.wait_for('message', check=authcheck, timeout=90)
                if len(eventimg.attachments) > 0:
                    url = eventimg.attachments[0].url
                else:
                    url = eventimg.content
                img = True
                eventimgReq = requests.get(url)
                eventimgArr = io.BytesIO(eventimgReq.content)
                eventimgArr.seek(0)
                sendFile = discord.File(fp=eventimgArr, filename="event.png")
                embed.set_image(url="attachment://event.png")  
            except SaidNoError:
                pass
            embed.set_author(name="Press 📅 to sign up for this event.")
            embed.set_footer(text="Local Time")
            embed.add_field(name="Where is the event happening?", value=eventloc.content, inline=True)
            datestr = truedate.strftime("%A %B %-d, %Y at %-I:%M%p UTC")
            embed.add_field(name="When is the event happening?", value=datestr, inline=True)
            if img:
                await ctx.send(embed=embed, file=sendFile)
            else:
                await ctx.send(embed=embed)
            await ctx.send("Does this look correct?")
            await self.bot.wait_for('message', check=nocheck, timeout=90)
            eventtitle = eventname.content.replace("\"", "\\\"")
            eventtitle = eventtitle.replace("\'", "\\\'")
            await ctx.send("Sending event")
            eventchan = ctx.guild.get_channel(596045539011854341)
            if img:
                eventimgArr.seek(0)
                sendFile = discord.File(fp=eventimgArr, filename="event.png")
                embed.set_image(url="attachment://event.png")
                msg = await eventchan.send(embed=embed, file=sendFile)
            else:
                msg = await eventchan.send(embed=embed)
            dbinsert = f"INSERT INTO Events(Time,Title, MessageID) values({int(truedate.timestamp())}, \"{eventtitle}\", {msg.id})"
            await msg.add_reaction("📅")
            try:
                await DB.execute(dbinsert, self.DBConn)
                await ctx.send("Event sent to <#596045539011854341>")
            except:
                await msg.delete()
                await ctx.send("Error storing data. Event not sent")
        except SaidNoError:
            await ctx.send("Alright. Try the command again and adjust")
        except asyncio.TimeoutError:
            await ctx.send("Timeout reached. Try again later")
        except ValueError:
            await ctx.send("That seems to be an invalid date. Try again later.")

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        if payload.channel_id == 596045539011854341 and payload.user_id != 470691679712706570:
            msgID = payload.message_id
            userID = payload.user_id
            event = await DB.select_one(f"SELECT ID, Title FROM Events WHERE MessageID = {msgID}", self.DBConn)
            eventname = event[1]
            eventID = event[0]
            insertSQL = f"INSERT INTO EventSignups(User, Event) VALUES ({userID}, {eventID})"
            user = self.bot.get_user(userID)
            events = self.bot.get_guild(269657133673349120).get_channel(596045539011854341)
            try:
                await DB.execute(insertSQL, self.DBConn)
                try:
                    await user.send(f"You are signed up for the `{eventname}` Event\nIf you wish to no longer be signed up, press 📅 again\n\nYou will receive a reminder before the event.")
                except:
                    await events.send(f"{user.mention}, You are signed up for the `{eventname}` Event\nIf you wish to no longer be signed up, press 📅 again\n\nTo get a reminder before the event, make sure your DMs are on.", delete_after=5.0)
                finally:
                    msg = await events.fetch_message(msgID)
                    await asyncio.sleep(.5)
                    await msg.remove_reaction("📅", user)
            except:
                deleteSQL = f"DELETE FROM EventSignups WHERE Event = {eventID} AND User = {userID}"
                await DB.execute(deleteSQL, self.DBConn)
                try:
                    await user.send(f"You are no longer signed up for the `{eventname}` Event")
                except:
                    await events.send(f"{user.mention}, You are no longer signed up for the `{eventname}` Event", delete_after=5.0)
                finally:
                    msg = await events.fetch_message(msgID)
                    await asyncio.sleep(.5)
                    await msg.remove_reaction("📅", user)

    @commands.command(brief=helpInfo['nobandito']['brief'], usage=helpInfo['nobandito']['usage'])
    @commands.has_role(config['staff_Role'])
    async def nobandito(self, ctx):
        await ctx.send("Non-muted Users without bandito role: ")
        guild = ctx.message.channel.guild
        sendMsg = ""
        bandito = guild.get_role(269660541738418176)
        muted = guild.get_role(278225702455738368)
        new = guild.get_role(430170511385952267)
        for member in guild.members:
            if bandito not in member.roles and muted not in member.roles and member.id != 115385224119975941 and not member.pending:
                if len(sendMsg) + len(f"<@{member.id}>") > 2000:
                    await ctx.send(sendMsg)
                    sendMsg = ""
                sendMsg += f"<@{member.id}>\n"
        if len(sendMsg) > 0:
            await ctx.send(sendMsg)
        await ctx.send("Done!")
        def check(m):
            if m.author == ctx.message.author and m.channel == ctx.message.channel:
                if m.content.lower() == 'yes':
                    return True
                elif m.content.lower() == 'no':
                    raise SaidNoError
                else:
                    return False
            else:
                return False
        try:
            await ctx.send(f"{ctx.message.author.mention}, Would you like me to fix it? Say Yes or No:")
            await self.bot.wait_for('message', check=check, timeout=30)
            for member in guild.members:
                if bandito not in member.roles and muted not in member.roles and member.id != 115385224119975941:
                    try:
                        await member.add_roles(bandito)
                        await member.add_roles(new)
                    except Exception as e:
                        await ctx.send(f"Error adding role to <@{member.id}>")
                        print(e)
            await ctx.send("Done!")
        except SaidNoError:
            await ctx.send("Alright. Use `$nobandito` again later if you change your mind.")
        except asyncio.TimeoutError:
            await ctx.send("Timeout reached. Try again later")

    @commands.command(brief=helpInfo['cancel']['brief'], usage=helpInfo['cancel']['usage'])
    @commands.has_role(config['staff_Role'])
    async def cancel(self, ctx, user: discord.Member):
        staffRole = self.bot.get_guild(
            config['server_ID']).get_role(config['staff_Role'])
        if staffRole not in user.roles:
            await user.edit(nick="cancelled_user")
            await ctx.send(f"{user.mention} has been cancelled!")
        elif user.id == 291645365281751043:
            await ctx.send("Vil is already cancelled")
        else:
            await ctx.send("You cannot cancel another staff member!")

    @commands.command(brief=helpInfo['status']['brief'], usage=helpInfo['status']['usage'])
    @commands.has_role(config['staff_Role'])
    async def status(self, ctx, statustype="watching", *, statusmsg="Member count"):
        guild = self.bot.get_guild(config['server_ID'])

        if statusmsg.lower() == "member count":
            statusmsg = f"{guild.member_count - config['botCount']} members"
        
        if statustype.lower() == "watching":
            activity =  discord.Activity(type=discord.ActivityType.watching, name=statusmsg)
        elif statustype.lower() == "playing":
            activity =  discord.Activity(type=discord.ActivityType.playing, name=statusmsg)
        elif statustype.lower() == "competing":
            activity =  discord.Activity(type=discord.ActivityType.competing, name=statusmsg)
        elif statustype.lower() == "streaming":
            activity =  discord.Activity(type=discord.ActivityType.streaming, name=statusmsg)
        elif statustype.lower() == "listening":
            activity =  discord.Activity(type=discord.ActivityType.streaming, name=statusmsg)
        else:
            activity =  discord.Activity(type=discord.ActivityType.watching, name=statusmsg)

        await self.bot.change_presence(status=discord.Status.online, activity=activity)
        await ctx.send("OK")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def fixvc(self, ctx):
        msg = await ctx.send("Fixing VC role")
        vc = ctx.channel.guild.get_role(465268535543988224)
        removeCount = 0
        for member in vc.members:
            try:
                await member.remove_roles(vc, reason="Cleaning VC role")
                removeCount += 1
            except:
                pass

        readdCount = 0
        for channel in ctx.channel.guild.voice_channels:
            for member in channel.members:
                try:
                    await member.add_roles(vc, reason="Readd VC role")
                    readdCount += 1
                except:
                    pass
        
        await msg.edit(content = f"Done. VC role removed from {removeCount} and readded to {readdCount}.")

    @commands.command(brief=helpInfo['say']['brief'], usage=helpInfo['say']['usage'])
    @commands.has_role(config['staff_Role'])
    async def say(self, ctx, channel: discord.TextChannel = None, *, textToSay):
        if re.search('<@&?[0-9]{15,32}>',textToSay):
            def check(m):
                if m.author == ctx.message.author and m.channel == ctx.message.channel:
                    if m.content.lower() == 'yes':
                        return True
                    elif m.content.lower() == 'no':
                        raise SaidNoError
                    else:
                        return False
                else:
                    return False
            try:
                await ctx.send(f"Your message contains a user or role ping. Are you sure you wish to ping?")
                await self.bot.wait_for('message', check=check, timeout=30)
                await channel.send(textToSay)

                await ctx.send("Sent")
            except SaidNoError:
                textToSay = discord.utils.escape_mentions(textToSay)
                await channel.send(textToSay)
                await ctx.send("Sent without ping")

            except asyncio.TimeoutError:
                await ctx.send("Timeout reached. Try again later")
        else:
            textToSay = discord.utils.escape_mentions(textToSay)
            await channel.send(textToSay)
            await ctx.send("Sent")


    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def spam_cleanup(self, ctx):
        guild = ctx.message.channel.guild
        for member in guild.members:
            if int(curtime()) -604800 < member.created_at.timestamp() and int(curtime()) -3600 < member.joined_at.timestamp():
                try:
                    await member.dm("We are currently getting bot raided and your account appears suspicious. As of such, you have been kicked")
                except:
                    pass
                
                await member.kick(reason="Spam Bot")
                banLog = self.bot.get_channel(689685441485733952)
                await banLog.send(f"{member.mention} appears to be a spam bot and has been kicked")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def veriwarn(self, ctx):
        veri = ctx.guild.get_channel(940390987841302598)
        await veri.send("""Hello! This is a reminder that <#940390987841302598> is a channel strictly for theories, \
lore and ARGs. All other topics belong to general chats (<#470330055063633920> and <#470330688235765770>). If the channel continues \
being off topic, it will be temporarily locked down.""")
        await ctx.send("Warning sent")
    
    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def verilock(self, ctx):
        veri = ctx.guild.get_channel(940390987841302598)
        verirole = ctx.guild.get_role(475388751711830066)
        await veri.set_permissions(verirole, send_messages=False)
        await veri.send("""Due to conversations frequently going off topic, this channel has been temporarily locked down.\
<#940390987841302598> is meant for high level discussion of the bands theories, lore, and ARGs - all other general \
topics belong to <#470330055063633920> and <#470330688235765770> The channel will reopen in 15 minutes.""")
        await asyncio.sleep(900)
        await veri.set_permissions(verirole, send_messages=True)


    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def dm(self, ctx, user: discord.Member, *, textToSay):
        await user.send(textToSay)

        staff_commands = ctx.channel.guild.get_channel(488076541499277333)
        embedCmd = discord.Embed(title="$dm used", colour=0x753543)
        embedCmd.set_author(name=ctx.author.name, icon_url=ctx.author.avatar_url)
        embedCmd.add_field(name="User DMd", value=f"{user.display_name} - {user.id}", inline=False)
        embedCmd.add_field(name="Message", value=textToSay, inline=False)
        await staff_commands.send(embed=embedCmd)
        await ctx.send("DM sent!")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def clear_webhook_messages(self, ctx):
        bypass = [940294719383175228]
        await ctx.send("Starting delete")
        guild = ctx.guild
        begin = datetime.fromtimestamp(1644249600)
        end = datetime.fromtimestamp(1644252300)
        total = 0
        for channel in guild.channels:
            if channel.id not in bypass:
                try:
                    #await ctx.send(f"Starting in {channel.mention}")
                    count = 0
                    async for message in channel.history(limit=2000, before = end, after = begin):
                        try:
                            if message.webhook_id is not None:
                                count += 1
                                await message.delete()
                            if message.content.lower().find("https://discords.chat/nitro/806MPUZ0O3UDOA6") != -1:
                                count += 1
                                await message.delete()
                            if message.content.lower().find("@everyone") != -1:
                                count += 1
                                await message.delete()
                        except:
                            pass
                    if count > 0:
                        await ctx.send(f"{count} messages deleted in {channel.mention}")
                    total += count
                except Exception as e:
                    await ctx.send(f"Error for {channel.mention}: {e}")

        await ctx.send("Done")


    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def aotwdm(self, ctx, user: discord.Member):
        aotwDMmsg = """You are getting this message because you sent an off-topic message 
in the #aotw-discussion channel in the twenty one pilots discord.\n
#aotw-discussion is a channel meant to talk about the latest album 
listed in the channel right above it, #album-of-the-week.\n 
Our general discussion channels are #hometown and #slowtown.\n
Discussions involving theories about the new album can be found in #theories.\n
Please be sure to read our rules channel for more info. \n\
Thanks!"""
        try:
            await user.send(aotwDMmsg)
            msgResp = await ctx.send("DM Sent")
            await msgResp.delete(delay=5.0)
        except:
            msgResp = await ctx.send("Unable to DM user - they may have their DMs off")
            await msgResp.delete(delay=5.0)
        finally:
            await ctx.message.delete(delay=2.0)
            staff_commands = ctx.channel.guild.get_channel(488076541499277333)
            embedCmd = discord.Embed(title="$aotwdm used", colour=0x753543)
            embedCmd.set_author(name=ctx.author.name, icon_url=ctx.author.avatar_url)
            embedCmd.add_field(name="User DMd", value=f"{user.display_name} - {user.id}")
            await staff_commands.send(embed=embedCmd)


    @commands.command(brief=helpInfo['userinfo']['brief'], usage=helpInfo['userinfo']['usage'])
    @commands.has_role(config['staff_Role'])
    async def memberinfo(self, ctx, *, user: discord.Member):
        joinDate = user.joined_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        createdDate = user.created_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        userRoles = user.roles
        rolestr = ""
        for role in userRoles:
            if role.id != config['server_ID']:
                rolestr += f"{role.mention}, "
        rolestr = rolestr[:len(rolestr) - 2]
        if len(rolestr) <= 1:
            rolestr = "No roles"
        embedInfo = discord.Embed(colour=0x753543)
        embedInfo.set_author(name=user.name, icon_url=user.avatar_url)
        embedInfo.add_field(name="User ID", value=user.id, inline=False)
        embedInfo.add_field(name="Last Join Date", value=joinDate, inline=False)
        embedInfo.add_field(name="Account Creation Date", value=createdDate, inline=False)
        embedInfo.set_image(url=user.avatar_url)
        embedInfo.add_field(name="Roles", value=rolestr, inline=False)

        await ctx.send(embed=embedInfo)

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def userinfo(self, ctx, *, user: discord.User):
        createdDate = user.created_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        embedInfo = discord.Embed(colour=0x753543)
        embedInfo.set_author(name=user.name, icon_url=user.avatar_url)
        embedInfo.add_field(name="User ID", value=user.id, inline=False)
        embedInfo.set_image(url=user.avatar_url)
        embedInfo.add_field(name="Account Creation Date", value=createdDate, inline=False)

        await ctx.send(embed=embedInfo)

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def getoldusers(self, ctx, num):
        members = list()
        for mem in ctx.guild.members:
            members.append(mem.id)
            print(mem.id)
        print(members)
        members = members.sort()
        output = ""
        for x in range(0,int(num)):
            output += f"<@{members[x]}>\n"

        await ctx.send(output)

#    @commands.command(brief=helpInfo['image']['b
#    @commands.has_role(config['staff_Role'])
    async def image(self, ctx, *, query):
        gis = GoogleImagesSearch(config['googleAPI'], config['googleCX'])
        imgDwnld = BytesIO()
        gis.search({'q': query, 'num': 1})
        sendFile = None
        for image in gis.results():
            imgDwnld.seek(0)
            raw_image_data = image.get_raw_data()
            image.copy_to(imgDwnld, raw_image_data)
            imgDwnld.seek(0)
            sendFile = discord.File(fp=imgDwnld, filename=f"{query}.png")
        try:
            await ctx.send(file=sendFile)
        except:
            await ctx.send("I cannot find any image for that search!")

    @commands.command(brief=helpInfo['raidmode']['brief'], usage=helpInfo['raidmode']['usage'])
    @commands.has_role(config['staff_Role'])
    async def raidmode(self, ctx, toggle="on"):
        server = self.bot.get_guild(269657133673349120)
        banditos = server.get_role(269660541738418176)
        staff = server.get_role(330877657132564480)
        de = server.get_role(283272728084086784)

        if toggle.lower() == "off":
            undoLock = discord.PermissionOverwrite()
            undoLock.send_messages = None

            undoImageDeny = discord.PermissionOverwrite()
            undoImageDeny.attach_files = None
            undoImageDeny.embed_links = None

            for chan in raidmodeChans: # unlock channels
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=undoLock)
                await channel.send("This channel is now unlocked")

            for chan in raidmodeLock: # allow images
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=undoImageDeny)
                await channel.set_permissions(de, overwrite=undoImageDeny)
            await ctx.send("Raidmode has been turned off.")
        elif toggle.lower() == "on":
            lockPerms = discord.PermissionOverwrite() # Deny Sending Messages
            lockPerms.send_messages = False

            allowSend = discord.PermissionOverwrite() # Allow sending messages
            allowSend.send_messages = True

            imageSend = discord.PermissionOverwrite() # Allow sending images
            imageSend.attach_files = True
            imageSend.embed_links = True

            imageDeny = discord.PermissionOverwrite() # Deny Sending images
            imageDeny.attach_files = False
            imageDeny.embed_links = False

            for chan in raidmodeChans:
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=lockPerms) # Deny sending messages
                await channel.set_permissions(staff, overwrite=allowSend) # Allow staff to message
                await channel.send("This channel has been temporarily locked.")

            for chan in raidmodeLock:
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=imageDeny) # Deny sending images
                await channel.set_permissions(de, overwrite=imageSend) # Allow DE to send images
                await channel.set_permissions(staff, overwrite=imageSend) # Allow staff to send images

            await ctx.send("Raidmode has been turned on. Use `$raidmode off` to turn off")
    

    @commands.command()
    @commands.check(is_owner)
    async def vanity(self, ctx):
        await self.set_vanity_url(ctx.channel)


    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def get_fbs(self, ctx):
        guild = ctx.guild
        fb = guild.get_role(283272728084086784)
        fblist = ""
        for member in fb.members:
            fblist += f"{member.name}#{member.discriminator}\n"
        
        with open("fbs.txt", "w") as file:
            file.write(fblist)

        with open("fbs.txt", "rb") as file:
            dFile = discord.File(file, "List_of_FBs.txt")
            await ctx.send(file=dFile)

    @commands.command(brief=helpInfo['shutdown']['brief'], usage=helpInfo['shutdown']['usage'])
    @commands.has_role(config['staff_Role'])
    async def shutdown(self, ctx, toggle="on"):
        server = self.bot.get_guild(269657133673349120)
        banditos = server.get_role(269660541738418176)
        staff = server.get_role(330877657132564480)

        if toggle.lower() == "off":
            undoLock = discord.PermissionOverwrite()
            undoLock.send_messages = None
            for chan in shutdownChans:
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=undoLock)
                await channel.send("This channel has been unlocked")
            await ctx.send("Channels have been unlocked")

        elif toggle.lower() == "on":
            lockPerms = discord.PermissionOverwrite() # Deny Sending Messages
            lockPerms.send_messages = False

            allowSend = discord.PermissionOverwrite() # Allow sending messages
            allowSend.send_messages = True

            for chan in shutdownChans:
                channel = self.bot.get_channel(chan)
                await channel.set_permissions(banditos, overwrite=lockPerms)
                await channel.set_permissions(staff, overwrite=allowSend)
                await channel.send("This channel has been temporaily locked")
            await ctx.send("All channels have been shutdown. Use `$shutdown off` to turn off")
    
    @commands.check
    async def globally_block_dms(self, ctx):
        return ctx.guild is not None
    
    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def delete(self, ctx, numMessages: int):
        if numMessages > 100 or numMessages <= 0:
            await ctx.send("Please specify a number between 1 and 100")
        else:
            await ctx.channel.delete_messages(numMessages)

    @commands.command()
    async def check_pings(self, ctx, msgID:int, chanID: int):
        chan = self.bot.get_channel(chanID)
        msg = await chan.fetch_message(msgID)
        await ctx.send(f"{msg.content.find('@everyone') != -1}")
        await ctx.send(len(msg.author.roles))
    
    @commands.Cog.listener()
    async def on_message(self, message):
        if message.author.id != 470691679712706570:
            if (not isinstance(message.channel, discord.DMChannel)):
                if message.webhook_id is None:
                    await self.process_slurs(message)
                    await self.process_steam_scam(message)
                    await self.ping_off(message)
                    await self.phraseblacklist(message)
                    await self.process_invites(message)
                    # await self.process_caf(message)
                    '''try:
                        await self.process_nitro_scam(message)
                    except Exception as e:
                        testchan = self.bot.get_channel(470406597860917249)
                        await testchan.send(f"Failed to check nitro - {type(e)}: {e}. {type(message)} ID: {message.id}")'''


    async def process_steam_scam(self, message):
        if message.content.lower().find("https://stearncomminuty.ru/") != -1:
            await message.author.send("You have been automatically banned for sending what appears to be a Steam Scam link\nIf this was a mistake, please appeal at https://www.discordclique.com/appeals")
            staffChan = self.bot.get_channel(815016457669705778)
            try:
                await message.author.ban(reason="Steam Scam Link [AUTO]")
                await staffChan.send(f"{message.author.mention} has been automatically banned for sending a Steam Scam link.")
            except:
                await staffChan.send(f"I tried to ban {message.author.mention} for sending a Steam Scam link, but was unable to.")

    async def process_slurs(self, message):
        server = self.bot.get_guild(269657133673349120)
        staff = server.get_role(330877657132564480)

        if message.content.lower().find('nigger') != -1:
            if staff not in message.author.roles:
                await message.author.ban(reason="slur")

    async def leak_links(self, message):
        server = self.bot.get_guild(269657133673349120)
        staff = server.get_role(330877657132564480)
        DE = server.get_role(283272728084086784)
        roles = message.author.roles
        msg = message.content.lower()
        if msg.find("https://drive.google.com") != -1 or msg.find("https://www.youtube.com") != -1 or msg.find("https://youtu.be") != -1:
            if staff not in roles and DE not in roles and message.channel.id != 940390987841302598:
                await message.delete()
                try:
                    await message.author.send("To prevent sharing of livestream footage, we are currently not allowing Google Drive or Youtube Links.")
                except:
                    await message.channel.send(f"{message.author.mention}, To prevent sharing of livestream footage, we are currently not allowing Google Drive or Youtube Links.")
                chatModeration = self.bot.get_channel(844750081969487882)
                await chatModeration.send(f"{message.author.mention} sent a link in {message.channel.mention}\n```{message.content}```")

    async def process_caf(self, message):
        if message.channel.id == 625446554798391316:
            guild = self.bot.get_guild(config['server_ID'])
            staff = guild.get_role(330877657132564480)
            caf = self.bot.get_channel(625446554798391316)
            if staff in message.role_mentions:
                await caf.send("Make me")

    async def process_invites(self, message):
        server = self.bot.get_guild(269657133673349120)
        staff = server.get_role(330877657132564480)
        inviteLink = re.search('(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li)|discordapp\.com\/invite)\/.+[A-Z0-9a-z]', message.content)
        if inviteLink is not None and staff not in message.author.roles:
            invite = await self.bot.fetch_invite(inviteLink.group())
            await message.delete()
            await message.channel.send(delete_after=10.0, content =f"{message.author.mention} Please do not send links to other servers!")
            inviteLog = self.bot.get_channel(495471332151132170)
            inviteEm = discord.Embed(title="Invite Link Sent", colour=0xeb6123)
            inviteEm.set_author(name=f"{message.author.display_name} - {message.author.id}", icon_url=message.author.avatar_url, url=message.jump_url)
            inviteEm.add_field(name ="Channel", value=f"{message.channel.mention}", inline=True)
            inviteEm.add_field(name="Invite Server", value= invite.guild.name, inline=True)
            inviteEm.set_thumbnail(url=invite.guild.icon_url)
            inviteEm.add_field(name="Invite Links", value=inviteLink.group(), inline=True)
            await inviteLog.send(embed=inviteEm)

    async def set_vanity_url(self, channel):
        guild = self.bot.get_guild(config['server_ID'])
        url = "twentyonepilots"
        try:
            await guild.edit(vanity_code=url)
            await channel.send(f"<@207129652345438211> THE INVITE URL IS BACK")
            await self.check_vanity.stop()
        except Exception as e:
            await channel.send(f"Error when setting vanity```{type(e)} - {e}```")
    
    async def process_nitro_scam(self, message):
        whitelist = [799094891929796658]
        guild = self.bot.get_guild(config['server_ID'])
        staff = guild.get_role(330877657132564480)
        fb = guild.get_role(283272728084086784)
        if staff in message.author.roles:
            return
        
        newRole = guild.get_role(430170511385952267)
        msgContent = message.content
        author = message.author
        shouldBan = False
        shouldMute = False
        staffchan = self.bot.get_channel(815016457669705778)
        testchan = self.bot.get_channel(470406597860917249)
        
        indicators = await self.get_nitro_indicators(msgContent)
        for char in msgContent:
            if char not in ascii_letters:
                msgContent = msgContent.replace(char, "")
        
        #indicators += await self.get_nitro_indicators(msgContent)

        if indicators > 2:
            await testchan.send(f"{message.jump_url} had {indicators} indicators. {message.author.mention}")
    
        if indicators > 4:
            if len(author.roles) == 2:
                    shouldBan = True
            elif newRole in author.roles:
                    shouldBan = True
            else:
                shouldMute = True
        
        if indicators > 8:
            if int(len(author.roles)/indicators) > 2:
                shouldMute = True
            else:
                shouldBan = True

        if shouldBan and fb in message.author.roles:
            shouldBan = False
            shouldMute = True

        if shouldBan:
            nitroEm = discord.Embed(title="Nitro Scam Sent", description = "User has been automatically banned.", colour=0xeb6123)
            nitroEm.set_author(name=f"{message.author.display_name} - {message.author.id}", icon_url=message.author.avatar_url, url=message.jump_url)
            nitroEm.add_field(name ="Message", value=f"{message.content}", inline=True)
            nitroEm.add_field(name ="Channel", value=f"{message.channel.mention}", inline=True)
            nitroEm.set_footer(text = f"Indicator Score: {indicators}")

            if author.id in whitelist:
                await author.send("You're a dipshit for trying this again")
                staffMsg = f"{author.mention} tried it again"
                await staffchan.send(staffMsg)
            else:
                try:
                    await author.send("You have been automatically banned for sending a Nitro scam. If this is a mistake, visit https://www.discordclique.com/appeals")
                except:
                    nitroEm.set_footer(text = f"{nitroEm.footer}. I was unable to DM them before banning")

                await author.ban(reason="Nitro Scam", delete_message_days=1)
                await staffchan.send(f"{message.author.mention}", embed=nitroEm)

        elif shouldMute:
            muted = guild.get_role(278225702455738368)
            banditos = guild.get_role(269660541738418176)
            if author.id in whitelist:
                await author.send("You're a dipshit for trying this again")
                staffMsg = f"{author.mention} tried it again"
                await staffchan.send(staffMsg)
            else:
                nitroEm = discord.Embed(title="Nitro Scam Sent", description = "User has been automatically muted. They appear to be a regular user.", colour=0xeb6123)
                nitroEm.set_author(name=f"{message.author.display_name} - {message.author.id}", icon_url=message.author.avatar_url, url=message.jump_url)
                nitroEm.add_field(name ="Message", value=f"{message.content}", inline=True)
                nitroEm.add_field(name ="Channel", value=f"{message.channel.mention}", inline=True)
                nitroEm.set_footer(text = f"Indicator Score: {indicators}")

                await message.delete()
                await author.add_roles(muted)
                await author.remove_roles(banditos)
                try:
                    await author.send("You have been automatically muted for sending a Nitro scam. If this is a mistake, reply to this message.")
                except:
                    nitroEm.set_footer(text = f"{nitroEm.footer}. I was unable to DM them before banning")
                
                await staffchan.send(f"{message.author.mention}", embed=nitroEm)

    async def get_nitro_indicators(self, msgContent):
        linkregex = "(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})"
        indicators = 0
        if msgContent.lower().find('@everyone') != -1:
            indicators += 2    
        if (msgContent.lower().find('nitro') != -1 and msgContent.lower().find('free') != -1 and msgContent.lower().find('gift') != -1):
            indicators += 3
        elif (msgContent.lower().find('nitro') != -1 and msgContent.lower().find('free') != -1):
            indicators += 2
        elif (msgContent.lower().find('nitro') != -1 and msgContent.lower().find('gift') != -1):
            indicators += 2
        elif msgContent.lower().find('nitro'):
            indicators += 1 
        if msgContent.lower().find("who is first") != -1:
            indicators += 3
        links = re.findall(linkregex, msgContent)
        if len(links) > 0:
            for link in links:

                # Safe Links #
                if link.lower().find("discord.gift") != -1:
                    return 0
                if link.lower().find("discord.com") != -1:
                    return 0
                if link.lower().find("reddit.com") != -1:
                    return 0
                if link.lower().find("x.com") != -1:
                    return 0
                if link.lower().find("discordclique.com") != -1:
                    return 0
                if link.lower().find("twentyonepilots.wiki") != -1:
                    return 0
                if link.lower().find("discordapp.net") != -1:
                    return 0
                if link.lower().find("discordapp.com") != -1:
                    return 0
                if link.lower().find("tenor") != -1:
                    return 0
                if link.lower().find("giphy") != -1:
                    return 0
                if link.lower().find("discord.gg") != -1:
                    return 0
                if link.lower().find("discordstatus.com") != -1:
                    return 0
                if link.lower().find("twitter.com") != -1:
                    return 0
                if link.lower().find("clique") != -1:
                    return 0

                if link.lower().find("attachment") != -1:
                    indicators -= 2
                if link.lower().find("media") != -1:
                    indicators -= 2
                if link.lower().find("discord") != -1:
                    indicators += 4
                elif link.lower().find("discrds") != -1:
                    indicators += 4
                elif link.lower().find("discorl") != -1:
                    indicators += 4
                elif link.lower().find("discerd") != -1:
                    indicators += 4
                elif link.lower().find("discorc") != -1:
                    indicators += 4
                elif link.lower().find("disorde") != -1:
                    if link.lower().find("disorder") == -1:
                        indicators += 4
                elif link.lower().find("disccrd") != -1:
                    indicators += 4
                elif link.lower().find("dissqrd") != -1:
                    indicators += 4
                elif link.lower().find("discbrdapp") != -1:
                    indicators += 4
                elif link.lower().find("disczrd") != -1:
                    indicators += 4
                elif link.lower().find("newyears") != -1:
                    indicators += 2
                elif link.lower().find("dis") != -1:
                    indicators += 2
                if link.lower().find("gift") != -1:
                    indicators += 2
                if link.lower().find("nitro") != -1:
                    indicators += 4
        return indicators
        
    async def phraseblacklist(self, message):
        blacklist = ['freejup','free jup']
        server = self.bot.get_guild(269657133673349120)
        staff = server.get_role(330877657132564480)
        banditos = server.get_role(269660541738418176)
        muted = server.get_role(278225702455738368)
        for phrase in blacklist:
            if message.content.find(phrase) != -1 and staff not in message.author.roles:
                await message.delete()
                try:
                    await message.author.add_roles(muted)
                    await message.author.remove_roles(banditos)
                except Exception as e:
                    print("error muting")
                    print(e)
                
                try:    
                    await message.author.send("You have been automatically muted for saying a blacklisted phrase.\nPlease respond to this message if there are any questions.")
                except:
                    print("Could not DM")
                chatModeration = self.bot.get_channel(815016457669705778)
                blacklistEm = discord.Embed(title="Blacklisted phrase said", description = "User has been automatically muted.", colour=0xeb6123)
                blacklistEm.add_field(name ="User", value=f"{message.author.display_name} - {message.author.id}", inline=False)
                blacklistEm.add_field(name ="Channel", value=f"{message.channel.mention}", inline=False)
                blacklistEm.add_field(name ="Message", value=f"{message.content}", inline=False)
                blacklistEm.add_field(name ="Blacklisted Phrase", value=f"{phrase}", inline=False)
                await chatModeration.send(f"{message.author.mention}", embed=blacklistEm)

    async def ping_off(self, message):
        if len(message.mentions) > 0:
            for mention in message.mentions:
                if mention.display_name.lower().find("ping off") != -1 or \
                    mention.display_name.lower().find("@ off") != -1 or \
                    mention.display_name.lower().find("@off") != -1 or \
                    mention.display_name.lower().find("no ping") != -1 or \
                    mention.display_name.lower().find("no @") != -1 or \
                    mention.display_name.lower().find("no@") != -1:
                    mentionEmbed = discord.Embed(title="Heads up!", description = "The user you just pinged or replied to requests that they are not pinged.", colour=0xeb6123)
                    mentionEmbed.set_footer(text=f"© 2024 x2110311x.")

                    await message.reply(mention_author=False, delete_after=10.0,embed=mentionEmbed)

    async def process_live_link(self, message):
        server = self.bot.get_guild(269657133673349120)
        staff = server.get_role(330877657132564480)
        if re.search('https:\/\/21p\.lili\.network\/[a-z0-9]*', message.content) and staff not in message.author.roles:
            await message.delete()
            await message.channel.send(delete_after=10.0, 
                content=f"{message.author.mention} Please do not send links to the live content outside of live.twentyonepilots.com!\nThe site content is paid to support the boys and their crew, due to the lack of touring.")
            inviteLog = self.bot.get_channel(844750081969487882)
            await inviteLog.send(f"Message sent by {message.author.mention} in {message.channel.mention} - {message.content}")
'''
    @commands.Cog.listener()
    async def on_member_join(self, member):
        guild = self.bot.get_guild(269657133673349120)
        bandito = guild.get_role(269660541738418176)
        new = guild.get_role(430170511385952267)
        try:
            await member.add_roles(bandito)
            await member.add_roles(new)
            auditlog = self.bot.get_channel(706882400889864223)
            await auditlog.send(f"{member.mention} joined the server. Added new and banditos")
        except:
            auditlog = self.bot.get_channel(706882400889864223)
            await auditlog.send(f"Error adding roles for {member.mention}")

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        auditlog = self.bot.get_channel(706882400889864223)
        await auditlog.send(f"{member.mention} - {member.name} left. what a loser")
'''

def setup(bot):
    bot.add_cog(Staff(bot))
