"""Sacarver.py

Main file for running Sarcarver

Example
-------
Simply just run the file

    $ python3 main.py

"""
# Include Libraries #
import asyncio
import discord
import logging
import time
import yaml

from difflib import SequenceMatcher
from datetime import datetime
from discord.ext import commands
from include import utilities
from os import system
from os.path import abspath

whitelist = ['hominochionophobia']
# General Variables #
with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)
intents = discord.Intents.all()
bot = commands.Bot(command_prefix=config['commandPrefix'], intents=intents, max_messages=5000)

load_errors = []
for extension in config['enabled_extensions']:  
    extension = f"cogs.{extension}"
    bot.load_extension(extension)
    '''except:
        load_errors.append(f"Unable to load {extension}")'''

@bot.listen()
async def on_message(message):
    if len(message.mentions) >= 20 and message.channel.guild.get_role(config['staff_Role']) not in message.author.roles:
        offender = message.author
        await offender.send(f"You have been automatically banned for mentioning {len(message.mentions)} people. \nIf this was a mistake, please appeal at https://www.discordclique.com/appeals")
        await offender.send("https://cdn.discordapp.com/emojis/648569239489216534.png")
        await offender.ban()
        staffChan = bot.get_channel(815016457669705778)
        await staffChan.send(f"{offender.mention} has been automatically banned for mentioning {len(message.mentions)} people.")
        await message.delete()
    elif len(message.mentions) >= 10 and message.channel.guild.get_role(config['staff_Role']) not in message.author.roles:
        offender = message.author
        server = bot.get_guild(269657133673349120)
        banditos = server.get_role(269660541738418176)
        muted = server.get_role(278225702455738368)
        await offender.remove_roles(banditos)
        await offender.add_roles(muted)
        await offender.send(f"You have been automatically muted for mentioning {len(message.mentions)} people. DM a staff member if you believe this to be a mistake.")
        staffChan = bot.get_channel(815016457669705778)
        await staffChan.send(f"{offender.mention} has been automatically muted for mentioning {len(message.mentions)} people.")
        await message.delete()

@bot.listen()
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        message = ctx.message.content[1:]
        cmdIndex = message.find(" ")
        if cmdIndex != -1:
            usedCommand = message[:cmdIndex]
        else:
            usedCommand = message
        foundCommand = None
        highestRatio = 0.0
        for command in bot.commands:
            commandName = command.name
            comparison = SequenceMatcher(None, usedCommand, commandName)
            if comparison.ratio() > highestRatio:
                highestRatio = comparison.ratio()
                foundCommand = command
        await ctx.send(f"Hmm! You forgot to specify {error.param}\n ```Usage: {config['commandPrefix']}{foundCommand.name} {foundCommand.usage}```")
    elif isinstance(error, commands.ExtensionNotLoaded):
        await ctx.send(f"Uhoh! The {error.name} extension is not loaded! Please contact x2110311x")
    elif isinstance(error, commands.NoPrivateMessage):
        await ctx.send("You can't use commands in DMs!")
    elif isinstance(error, commands.CheckFailure):
        msg = await ctx.send("You do not have permission to use this command(or this isn't #commands!)")
        await asyncio.sleep(3)
        await msg.delete()
    elif isinstance(error, commands.CommandNotFound):
        message = ctx.message.content[1:]
        cmdIndex = message.find(" ")
        if cmdIndex != -1:
            usedCommand = message[:cmdIndex]
        else:
            usedCommand = message
        foundCommand = None
        highestRatio = 0.0
        if usedCommand not in whitelist:
            for command in bot.commands:
                commandName = command.name
                comparison = SequenceMatcher(None, usedCommand, commandName)
                if comparison.ratio() > highestRatio:
                    highestRatio = comparison.ratio()
                    foundCommand = command
            if foundCommand is not None:
                if not usedCommand[0].isnumeric():
                    embedUnknownCommand = discord.Embed(title=f"Unknown command: {config['commandPrefix']}{usedCommand}", colour=0x753543)
                    embedUnknownCommand.add_field(
                        name=f"Did you mean to use {config['commandPrefix']}{foundCommand.name}?", value=foundCommand.brief, inline=False)
                    if foundCommand.usage is None:
                        cmdUsage = ""
                    else:
                        cmdUsage = foundCommand.usage
                    embedUnknownCommand.add_field(
                        name="Usage", value=f"{config['commandPrefix']}{foundCommand.name} {cmdUsage}", inline=False)
                    await ctx.send(embed=embedUnknownCommand)
    else:
        await ctx.send(f"Unknown error occured. Please contact x2110311x \n{type(error)} - {error}")


@bot.check
async def block_hometown(ctx):
    server = bot.get_guild(269657133673349120)
    staff = server.get_role(330877657132564480)
    return ctx.message.channel.id != 470330055063633920 or staff in ctx.message.author.roles

@bot.check
async def globally_block_dms(ctx):
    return ctx.guild is not None

@bot.listen()
async def on_ready():
    print("Logged in")

    # Message Testing Channel #
    chanTest = await bot.fetch_channel(config['testing_Channel'])
    await chanTest.send("Bot has started")
    for error in load_errors:
        await chanTest.send(error)

    # Update Status #
    guild = bot.get_guild(config['server_ID'])
    memberStatus = discord.Activity(type=discord.ActivityType.watching, name=f"{guild.member_count - config['botCount']} members")
    await bot.change_presence(status=discord.Status.online, activity=memberStatus)


bot.run(config['discordToken'], bot=True, reconnect=True)
