# ********************************************************* #
# Author: Alex Sweeney (x2110311x)
# Desc :This file is the main script for running Sacarver
# ********************************************************* #

# Included Libraries #
import discord
import datetime
import random
import os
import csv
from time import time, sleep
from discord.ext import commands
from google_images_download import google_images_download
from include import hackerman, utilities, config, txtutils, charts

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
                                          "with {svrTrench.member_count}"))
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
async def time(ctx):
    intCurEpoch = int(ctx.timestamp.timestamp())
    ctx.send("The current epoch is {intCurEpoch}")
