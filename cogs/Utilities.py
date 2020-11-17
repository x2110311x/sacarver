import discord
import time
import yaml
import asyncio

from datetime import datetime
from discord.ext import commands
from include import utilities
from os import system
from os.path import abspath


with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

with open(abspath(config['help_file']), 'r') as helpFile:
    helpInfo = yaml.safe_load(helpFile)

helpInfo = helpInfo['Utilities']
intStartTime = int(time.time())  # time the bot started at

async def is_owner(ctx):
    return ctx.author.id == int(config['owner'])


class SaidNoError(Exception):
    pass

class SaidCancelError(Exception):
    pass


class Utilities(commands.Cog, name="Utility Commands"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None

    @commands.command(brief=helpInfo['epoch']['brief'], usage=helpInfo['epoch']['usage'])
    async def epoch(self, ctx):
        intCurEpoch = int(time.time())
        await ctx.send(f"The current epoch is {intCurEpoch}")

    @commands.command(brief=helpInfo['fromepoch']['brief'], usage=helpInfo['fromepoch']['usage'])
    async def fromepoch(self, ctx, epoch: int):
        dateTime = datetime.utcfromtimestamp(epoch).strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        await ctx.send(f"{epoch} is {dateTime}")

    @commands.command(brief=helpInfo['reloadextensions']['brief'], usage=helpInfo['reloadextensions']['usage'])
    @commands.check(is_owner)
    async def reloadextensions(self, ctx):
        load_errors = []
        for extension in config['enabled_extensions']:  
            try:
                extension = f"cogs.{extension}"
                bot.reload_extension(extension)
            except:
                load_errors.append(f"Unable to load {extension}")
            finally:
                await ctx.send("Extensions reloaded!")

    @commands.command(brief=helpInfo['update']['brief'], usage=helpInfo['update']['usage'])
    @commands.check(is_owner)
    async def update(self, ctx):
        await ctx.send("Updating Bot")
        updateScript = abspath(config['update_script'])
        system(f'sudo {updateScript}')

    @commands.command(brief=helpInfo['restart']['brief'], usage=helpInfo['restart']['usage'])
    @commands.check(is_owner)
    async def restart(self, ctx):
        await ctx.send("Restarting Bot")
        restart_script = abspath(config['restart_script'])
        system(f'sudo {restart_script}')

    @commands.command(brief=helpInfo['ping']['brief'], usage=helpInfo['ping']['usage'])
    async def ping(self, ctx):
        msgResp = await ctx.send("Bot is up!")
        editStamp = utilities.msdiff(ctx.message.created_at, msgResp.created_at)
        strResp = f"Pong! `{editStamp}ms`"
        await msgResp.edit(content=strResp)

    @commands.command(brief=helpInfo['uptime']['brief'], usage=helpInfo['uptime']['usage'])
    async def uptime(self, ctx):
        nowtime = time.time()
        uptime = utilities.seconds_to_units(int(nowtime - intStartTime))
        await ctx.send(f"Sacarver has been online for `{uptime}`.")

    @commands.command(brief=helpInfo['report']['brief'], usage=helpInfo['report']['usage'])
    async def report(self, ctx):
        author = ctx.message.author

        def check2(m):
            if m.author == author and m.channel == author.dm_channel:
                if m.content.lower() == 'yes':
                    return True
                elif m.content.lower() == 'no':
                    raise SaidNoError
                else:
                    return False
            else:
                return False

        def check(m):
            if m.author == author and m.channel == author.dm_channel:
                if m.content.lower() == "cancel":
                    raise SaidCancelError()
                else:
                    return True
            else:
                return False

        await ctx.message.delete()
        dmMsg = await ctx.send("Check your DMs")
        await author.send("You can say cancel at any time to cancel the report")
        await author.send("What is the name or ID of the user you want to report?")
        await asyncio.sleep(2)
        await dmMsg.delete()
        try:
            userMsg = await self.bot.wait_for('message', check=check, timeout=90)
            await author.send("What channel did this happen in?")
            chanMsg = await self.bot.wait_for('message', check=check, timeout=90)
            await author.send("What is the reason for reporting this user?")
            reasonMsg = await self.bot.wait_for('message', check=check, timeout=90)
            await author.send("When did this happen?")
            whenMsg = await self.bot.wait_for('message', check=check, timeout=90)
            await author.send("Any other comments?")
            commentsMsg = await self.bot.wait_for('message', check=check, timeout=90)

            dateSubmitted = ctx.message.created_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
            embedReport = discord.Embed(title="New report submission", colour=0x753543)
            embedReport.set_author(name=ctx.message.author.name, icon_url=ctx.message.author.avatar_url)
            embedReport.add_field(name="Reported User", value=userMsg.content, inline=False)
            embedReport.add_field(name="Happened in", value=chanMsg.content, inline=False)
            embedReport.add_field(name="Time of incidence", value=whenMsg.content, inline=False)
            embedReport.add_field(name="Reason for report", value=reasonMsg.content, inline=False)
            embedReport.add_field(name="Other comments", value=commentsMsg.content, inline=False)
            embedReport.set_footer(text=f"© x2110311x. Submitted at : {dateSubmitted}")

            await author.send(embed=embedReport)
            await author.send("Would you like to send this report?")
            await self.bot.wait_for('message', check=check2, timeout=90)

            reportChan = self.bot.get_channel(config['submitted_reports'])
            await reportChan.send(embed=embedReport)
            await author.send("Your report has been submitted")
        except SaidCancelError:
            await author.send("Okay, you can send one again at any time")
        except SaidNoError:
            await author.send("Okay, you can send one again at any time")
        except asyncio.TimeoutError:
            await author.send("Timeout reached. Report cancelled!")


def setup(bot):
    bot.add_cog(Utilities(bot))