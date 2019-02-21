# ********************************************************* #
# Name: sacarver.py
# Author: Alex Sweeney (x2110311x)
# Desc: This file is the main script for running Sacarver
# ********************************************************* #

# Included Libraries #
import discord
import os
import csv
from time import time, sleep
from pathlib import Path
from random import randint
from datetime import datetime, timedelta
from discord.ext import commands
from google_images_download import google_images_download
from include import hackerman, utilities, config, txtutils, charts, checks

# General variables #
intBotStartTime = time()
boolMemberCountAsStatus = True
dictChannelBans = []

# Discord Variables #
client = discord.client()
bot = commands.Bot(command_prefix='$')

# Populate Channel Ban Dict #
with open('chanban.csv') as File:
    csvreader = csv.DictReader(File)
    for row in csvreader:
        dictChannelBans.append(row)


@client.event  # On Join Tasks #
async def on_member_join(member):
    global boolMemberCountAsStatus  # ensure global var #
    svrTrench = client.get_guild(config.serverid)
    if boolMemberCountAsStatus:
        await client.change_prescence(status=discord.Status.online,
                                      activity=discord.Game(
                                          f"with {svrTrench.member_count}"))
    for entry in dictChannelBans:
        if member.id == str(dict['id']):
            chanBannedFrom = client.get_channel(dict['chanid'])
            memToBan = client.get_user(dict['memid'])
            permOverwrite = discord.PermissionOverwrite()
            permOverwrite.read_messages = False
            permOverwrite.send_messages = False
            await client.edit_channel_permissions(chanBannedFrom,
                                                  memToBan, permOverwrite)

# Begin Commands #


@bot.command()
@notHometown()
async def time(ctx):
    intCurEpoch = int(ctx.timestamp.timestamp())
    ctx.send(f"The current epoch is {intCurEpoch}")


@bot.command()
@commands.has_role(config.roles['staff'])
async def totalmessagesyesterday(ctx):
    dtYesterday = datetime.now() - timedelta(days=1)
    intYesterday = int(datetime.combine(dtYesterday, datetime.max.time()).timestamp())
    embedStartGen = discord.Embed(title=None, type="rich", colour=0xF4DA01)
    embedStartGen.set_footer(name=client.user.name,
                             icon_url=client.user.avatar_url)
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
    embedResult.set_footer(name=client.user.name,
                           icon_url=client.user.avatar_url)
    imgToEmbed = discord.File(imgPath, name="image.png")
    embedResult.set_image(url="attachment://image.png")
    await msgGenStatus.delete()
    await ctx.send(file=imgToEmbed, embed=embedResult)


@bot.command()
@commands.has_role(config.roles['staff'])
async def usermessagesyesterday(ctx, *args, **kwargs):
    userForMessages = kwargs.get('user', ctx.author)
    dtYesterday = datetime.now() - timedelta(days=1)
    intYesterday = int(datetime.combine(dtYesterday, datetime.max.time()).timestamp())
    embedStartGen = discord.Embed(title=None, colour=0xF4DA01)
    embedStartGen.set_footer(name=client.user.name,
                             icon_url=client.user.avatar_url)
    embedStartGen.add_field(name="Generating image",
                            value="This may take some time")
    msgGenStatus = await ctx.send(embed=embedStartGen)
    imgPath = Path("/bots/sacarver/images" + str(intYesterday) +
                   userForMessages.id + ".png")
    if imgPath.is_file():
        imgPath = f"/bots/sacarver/images/{intYesterday}{userForMessages.id}.png"
    else:
        imgPath = str("/bots/sacarver/images" + str(intYesterday) +
                      userForMessages.id + ".png")
        charts.mymessyesterday(imgPath, userForMessages.id)
    embedResult = discord.Embed(title=f"Messages per hour yesterday for {ctx.author.name}",
                                colour=0xF4DA01)
    embedResult.set_footer(name=client.user.name,
                           icon_url=client.user.avatar_url)
    imgToEmbed = discord.File(imgPath, name="image.png")
    embedResult.set_image(url="attachment://image.png")
    await msgGenStatus.delete()
    await ctx.send(file=imgToEmbed, embed=embedResult)


@bot.command()
@commands.has_role(config.roles['staff'])
async def cancel(ctx, user):
    if ctx.server.get_role(config.roles["staff"] not in ctx.user.roles):
        await user.edit(nick="Cancelled")
    ctx.send("f{user.name} has been cancelled")


@bot.command()
@notHometown()
async def bigtext(ctx, *, text):
    while text.find(":") != -1:
        intColonPos1 = text.find(":")
        if text[intColonPos1 + 1:].find(":") != -1:
            intColonPos2 = text[intColonPos1 + 1:].find(":")
            if text[intColonPos1:intColonPos2].find(" ") != -1:
                text.replace(text[intColonPos1:intColonPos2], "")
            else:
                text.replace(":", "")
        else:
            text.replace(":", "")
    text = txtutils.bigtext(text)
    await ctx.send(text)


@bot.command()
@notHometown()
@notPingEveryone()
async def rate(ctx, *, text):
    await ctx.say(f"I would rate {text} **{randint(0,10)}** out of 10")
