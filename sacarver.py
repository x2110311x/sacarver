# ********************************************************* #
# Name: sacarver.py
# Author: Alex Sweeney (x2110311x)
# Desc: This file is the main script for running Sacarver
# ********************************************************* #

# Included Libraries #
import discord
import os
import csv
import time
from pathlib import Path
from random import randint
from datetime import datetime, timedelta
from discord.ext import commands
from google_images_download import google_images_download
from include import hackermanqs, utilities, config, txtutils, charts

# General variables #
intBotStartTime = time.time()
boolMemberCountAsStatus = True
dictChannelBans = []

# Discord Variables #
bot = commands.Bot(command_prefix='$')

# Populate Channel Ban Dict #
with open('chanban.csv') as File:
    csvreader = csv.DictReader(File)
    for row in csvreader:
        dictChannelBans.append(row)


# Define exceptions #
class HometownCommands(commands.CheckFailure):
    pass


class PingsEveryone(commands.CheckFailure):
    pass

# Check definitions #


def notHometown():
    async def predicate(ctx):
        if ctx.channel.guild.get_role(config.roles["staff"]) in ctx.author.roles:
            return True
        elif ctx.channel.id != config.channels["hometown"]:
            return True
        else:
            raise HometownCommands("Commands are not allowed in hometown")
    return commands.check(predicate)


def notPingEveryone():
    async def predicate(ctx):
        if ctx.message.clean_content.find("@everyone") != -1:
            raise PingsEveryone("I'm not going to ping everyone bud")
        elif ctx.message.clean_content.find("@here") != -1:
            raise PingsEveryone("I'm not going to ping here bud")
        else:
            return True
    return commands.check(predicate)


@bot.event  # On Join Tasks #
async def on_member_join(member):
    global boolMemberCountAsStatus  # ensure global var #
    svrTrench = bot.get_guild(config.serverid)
    if boolMemberCountAsStatus:
        await bot.change_presence(status=discord.Status.online,
                                  activity=discord.Game(
                                      f"with {svrTrench.member_count} members"))
    for entry in dictChannelBans:
        if member.id == str(dict['id']):
            chanBannedFrom = bot.get_channel(dict['chanid'])
            memToBan = bot.get_user(dict['memid'])
            permOverwrite = discord.PermissionOverwrite()
            permOverwrite.read_messages = False
            permOverwrite.send_messages = False
            await bot.edit_channel_permissions(chanBannedFrom,
                                               memToBan, permOverwrite)

# Begin Commands #


@bot.command()
@notHometown()
async def epoch(ctx):
    intCurEpoch = int(time.time())
    await ctx.send(f"The current epoch is {intCurEpoch}")


@bot.command()
@commands.has_role("Admin")
async def totalmessagesyesterday(ctx):
    dtYesterday = datetime.now() - timedelta(days=1)
    intYesterday = int(datetime.combine(
        dtYesterday, datetime.max.time()).timestamp())
    embedStartGen = discord.Embed(title=None, type="rich", colour=0xF4DA01)
    embedStartGen.set_footer(text=bot.user.name,
                             icon_url=bot.user.avatar_url)
    embedStartGen.add_field(name="Generating image",
                            value="This may take some time")
    msgGenStatus = await ctx.send(embed=embedStartGen)
    imgPath = Path(f"/bots/sacarver/images/{intYesterday}.png")
    if imgPath.is_file():
        imgPath = Path(f"/bots/sacarver/images/{intYesterday}.png")
    else:
        imgPath = Path(f"/bots/sacarver/images/{intYesterday}.png")
        charts.messyesterday(imgPath)
    embedResult = discord.Embed(title="Messages per hour yesterday for the server",
                                type="rich", colour=0xF4DA01)
    embedResult.set_footer(text=bot.user.name,
                           icon_url=bot.user.avatar_url)
    imgToEmbed = discord.File(imgPath, filename="image.png")
    embedResult.set_image(url="attachment://image.png")
    await msgGenStatus.delete()
    await ctx.send(file=imgToEmbed, embed=embedResult)


@bot.command()
@commands.has_role("Admin")
async def usermessagesyesterday(ctx, *args, **kwargs):
    userForMsg = kwargs.get('user', ctx.author)
    dtYesterday = datetime.now() - timedelta(days=1)
    intYesterday = int(datetime.combine(
        dtYesterday, datetime.max.time()).timestamp())
    embedStartGen = discord.Embed(title=None, colour=0xF4DA01)
    embedStartGen.set_footer(text=bot.user.name,
                             icon_url=bot.user.avatar_url)
    embedStartGen.add_field(name="Generating image",
                            value="This may take some time")
    msgGenStatus = await ctx.send(embed=embedStartGen)
    imgPath = Path(f"/bots/sacarver/images/{intYesterday}{userForMsg.id}.png")
    if imgPath.is_file():
        imgPath = f"/bots/sacarver/images/{intYesterday}{userForMsg.id}.png"
    else:
        imgPath = f"/bots/sacarver/images/{intYesterday}{userForMsg.id}.png"
        charts.mymessyesterday(imgPath, userForMsg.id)
    embedResult = discord.Embed(title=f"Messages per hour yesterday for {ctx.author.name}",
                                colour=0xF4DA01)
    embedResult.set_footer(text=bot.user.name,
                           icon_url=bot.user.avatar_url)
    imgToEmbed = discord.File(imgPath, filename="image.png")
    embedResult.set_image(url="attachment://image.png")
    await msgGenStatus.delete()
    await ctx.send(file=imgToEmbed, embed=embedResult)


@bot.command()
@commands.has_role("Admin")
async def cancel(ctx, user):
    user = ctx.message.mentions[0]
    if ctx.channel.guild.get_role(config.roles["staff"]) not in user.roles:
        await user.edit(nick="Cancelled")
    await ctx.send(f"{user.name} has been cancelled")


@bot.command()
@notHometown()
async def bigtext(ctx, *, text):
    while text.find("<") != -1:
        intColonPos1 = text.find("<")
        intColonPos2 = text.find(">")
        if intColonPos1 != -1 and intColonPos2 != -1:
            if text[intColonPos1:intColonPos2].find(" ") == -1:
                if text[intColonPos1:intColonPos2].find(":") != -1:
                    text = text.replace(
                        text[intColonPos1:intColonPos2 + 1], "")
        else:
            text = text.replace("<", "")
            text = text.replace(">", "")
    text = txtutils.bigtext(text)
    await ctx.send(text)


@bot.command()
@notHometown()
@notPingEveryone()
async def rate(ctx, *, text):
    await ctx.send(f"I would rate {text} **{randint(0,10)} out of 10**")


@bot.command()
@commands.has_role("Admin")
async def ban(ctx, user):
    user = ctx.message.mentions[0]
    if ctx.channel.guild.get_role(config.roles["staff"]) not in user.roles:
        await user.edit(nick="banned_user")
    await ctx.send(f"{user.name} has been banned")


@bot.command()
@notHometown()
async def magic8ball(ctx):
    await ctx.send(txtutils.magic8ball())


@bot.command()
@commands.has_role("Admin")
@notPingEveryone()
async def say(ctx, channel, *, text):
    channel = ctx.message.channel_mentions[0]
    await channel.send(text)


@bot.command()
@notHometown()
async def hackerman(ctx):
    strChosenQuote = hackermanqs.quotes[randint(0, len(hackermanqs.quotes) - 1)]
    embedHack = discord.Embed(title=strChosenQuote, colour=0x493388)
    embedHack.set_author(
        name="Hackerman", icon_url="https://i.kym-cdn.com/entries/icons/original/000/021/807/4d7.png")
    await ctx.send(embed=embedHack)


@bot.command()
@notHometown()
@notPingEveryone()
async def mock(ctx, *, text):
    strMock = txtutils.mock(text)
    embedMock = discord.Embed(title=strMock)
    embedMock.set_footer(text=bot.user.name,
                         icon_url=bot.user.avatar_url)
    imgToEmbed = discord.File("/bots/sacarver/images/mocking-spongebob.jpg", filename="image.png")
    embedMock.set_image(url="attachment://image.png")
    await ctx.send(file=imgToEmbed, embed=embedMock)


@bot.command()
@notHometown()
async def ping(ctx):
    msgResponse = await ctx.send("Bot is up!")
    strResp = f"Pong! `{utilities.msdiff(ctx.message.created_at,msgResponse.created_at)}ms`"
    await msgResponse.edit(content=strResp)


@bot.command()
@commands.has_role("Admin")
async def status(ctx, *, text):
    global boolMemberCountAsStatus
    if text.lower() == "member count":
        svrTrench = ctx.channel.guild
        await bot.change_presence(status=discord.Status.online,
                                  activity=discord.Game(
                                      f"with {svrTrench.member_count} members"))
        boolMemberCountAsStatus = True
    else:
        await bot.change_presence(status=discord.Status.online,
                                  activity=discord.Game(text))
        boolMemberCountAsStatus = False


@bot.command()
@notHometown()
async def uptime(ctx):
    nowtime = time.time()
    tillrestart = utilities.time_until_restart(intBotStartTime)
    uptime = utilities.seconds_to_units(int(nowtime - intBotStartTime))
    await ctx.send(f"Sacarver has been online for `{uptime}`.\n{tillrestart}")


@bot.command()
@commands.has_role("Admin")
async def image(ctx, *, query):
    response = google_images_download.googleimagesdownload()
    absolute_image_paths = response.download(
        {"keywords": f"{query}", "limit": 1,
         "output_directory": "/bots/sacarver/images"})
    print(absolute_image_paths[query][0])
    await ctx.send(file=discord.File(absolute_image_paths[query][0]))


@bot.command()
@commands.has_role("Admin")
async def imagine(ctx, *, query):
    response = google_images_download.googleimagesdownload()
    absolute_image_paths = response.download(
        {f"keywords": "{query}", "limit": 1,
         "output_directory": "/bots/sacarver/images"})
    await ctx.send(file=absolute_image_paths[query][0])


@bot.event  # On Join Tasks #
async def on_member_remove(member):
    global boolMemberCountAsStatus  # ensure global var #
    svrTrench = bot.get_guild(config.serverid)
    if boolMemberCountAsStatus:
        await bot.change_presence(status=discord.Status.online,
                                  activity=discord.Game(
                                      f"with {svrTrench.member_count} members"))


@bot.event
async def on_ready():
    # grab channel and server objects
    svrTrench = bot.get_guild(config.serverid)
    chanTest = bot.get_channel(config.channels['testchannel'])

    # Acknowledge that it's online
    print('Logged in')
    await chanTest.send("Bot is back online. Bot restarts every 12 hours.")
    # restartT.start()

    # Set the status
    await bot.change_presence(status=discord.Status.online,
                              activity=discord.Game(
                                  f"with {svrTrench.member_count} members"))


bot.run(config.bottoken)
