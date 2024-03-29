import yaml
import discord
import io
import asyncio

from discord.ext import commands
from random import randint
from PIL import Image
from include import txtutils
from include import utilities
from include import hackerman
from os.path import abspath
from colory.color import Color as xColor

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

with open(abspath(config['help_file']), 'r') as helpFile:
    helpInfo = yaml.safe_load(helpFile)

helpInfo = helpInfo['Fun']

class SaidNoError(Exception):
    pass

def commands_check():
    async def predicate(ctx):
        return ctx.message.channel.id in [470406597860917249, 470337593746259989, 480934371126280202, 940341308696965120] or ctx.guild.get_role(config['staff_Role']) in ctx.author.roles
    return commands.check(predicate)

class Fun(commands.Cog, name="Fun Commands"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None

    @commands.command(brief=helpInfo['rate']['brief'], usage=helpInfo['rate']['usage'])
    @commands_check()
    async def rate(self, ctx, *, object):
        object = discord.utils.escape_mentions(object)
        await ctx.send(f"I would rate {object} **{randint(0,10)} out of 10**")

    @commands.command(brief=helpInfo['magic8ball']['brief'], usage=helpInfo['magic8ball']['usage'])
    @commands_check()
    async def magic8ball(self, ctx):
        if ctx.message.content.lower().find('hate') != -1 and ctx.message.content.lower().find('bingus') != -1 and ctx.message.content.lower().find('you') != -1:
            await ctx.send("Absolutely I do.")
        else:
            await ctx.send(txtutils.magic8ball())
    
    @commands.command(brief=helpInfo['roll']['brief'], usage=helpInfo['roll']['usage'])
    @commands_check()
    async def roll(self, ctx, maxnum=6):
        try:
            maxnum = int(maxnum)
        except:
            await ctx.send("That doesn't appear to be an integer. Please input an integer")
            return
        rollnum = randint(1,maxnum)
        await ctx.send(f"You rolled a {rollnum}")

    @commands.has_role(config['staff_Role'])
    @commands.command(brief=helpInfo['yt']['brief'], usage=helpInfo['yt']['usage'])
    async def yt(self, ctx, *, query):
        msgSearch = await ctx.send(F"Searching for `{query}` ")
        try:
            await msgSearch.edit(content=utilities.ytsearch(query))
        except:
            await ctx.send("I cannot find any video for that search!")
    
    '''@commands.command(brief=helpInfo['bigtext']['brief'], usage=helpInfo['bigtext']['usage'])
    @commands_check()
    async def bigtext(self, ctx, *, bigtxt):
        await ctx.send(txtutils.bigtext(bigtxt))
   '''
    @commands.command(brief=helpInfo['mock']['brief'], usage=helpInfo['mock']['usage'])
    @commands_check()
    async def mock(self, ctx, *, mocktxt):
        mockpic = discord.File(abspath("./include/mock.jpg"))
        await ctx.send(txtutils.mock(mocktxt), file=mockpic)
    
    @commands.command(brief=helpInfo['spooky']['brief'], usage=helpInfo['spooky']['usage'])#
    @commands_check()
    async def spooky(self, ctx):
        user = ctx.message.author
        nickname = user.display_name
        newNick = f"👻🎃{nickname}🎃👻"
        if len(newNick) > 32:
            spookyEm = discord.Embed(title="That's a long name you got there....",
                                      description = "Your nickname is too long! Discord won't let me make you spooky.\nChange your nickname and try again",
                                    colour=0xeb6123)  
            spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
            await ctx.send(embed=spookyEm)
        else:
            if nickname.find("👻") != -1 and nickname.find("🎃") != -1:
                def check(m):
                    if m.author == user and m.channel == ctx.message.channel:
                        if m.content.lower() == "no":
                            raise SaidNoError()
                        elif m.content.lower() == "yes":
                            return True
                        else:
                            return False
                    else:
                        return False
                spookyEm = discord.Embed(title="Aaah! You already look pretty spooky.",
                                        description = "Are you sure you want to become spookier?", colour=0xeb6123)  
                spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                await ctx.send(embed=spookyEm)
                try:
                    await self.bot.wait_for('message', check=check, timeout=30)
                    try:
                        await user.edit(nick=newNick,reason="IT'S SPOOKY TIME")
                        spookyEm = discord.Embed(title="Boo!",
                                            description = f"You're lookin' pretty spooky there, {ctx.author.mention}", colour=0xeb6123)  
                        spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                        spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                        await ctx.send(embed=spookyEm)
                    except Exception as e:
                        spookyEm = discord.Embed(title="Uh oh!",
                                            description = "I wasn't able to update your nickname!\nCopy the nickname above and set it manually", colour=0xeb6123)  
                        spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                        spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                        await ctx.send(embed=spookyEm)
                        chanTest = self.bot.get_channel(config['testing_Channel'])
                        await chanTest.send(f"Error spookifing {user.mention}\n{e}")
                except SaidNoError:
                    spookyEm = discord.Embed(title="That's fine.",
                                        description = "You can always do it later by running the command again", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    await ctx.send(embed=spookyEm)
                except asyncio.TimeoutError:
                    spookyEm = discord.Embed(title=f"Did I scare you away, {ctx.author.mention}?",
                                        description = "I didn't get a valid answer from you.\nYou can always do it later by running the command again",
                                        colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    await ctx.send(embed=spookyEm)
            else:
                try:
                    await user.edit(nick=newNick,reason="IT'S SPOOKY TIME")
                    spookyEm = discord.Embed(title="Boo!",
                                        description = f"You're lookin' pretty spooky there, {ctx.author.mention}", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                    await ctx.send(embed=spookyEm)
                except Exception as e:
                    spookyEm = discord.Embed(title="Uh oh!",
                                        description = "I wasn't able to update your nickname!\nCopy the nickname above and set it manually", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                    await ctx.send(embed=spookyEm)
                    chanTest = self.bot.get_channel(config['testing_Channel'])
                    await chanTest.send(f"Error spookifing {user.mention}\n{e}")
    
    
	
    @commands.command(brief=helpInfo['festive']['brief'], usage=helpInfo['festive']['usage'])#
    @commands_check()
    async def festive(self, ctx):
        user = ctx.message.author
        nickname = user.display_name
        newNick = f"⛄🎁{nickname}🎁⛄"
        if len(newNick) > 32:
            spookyEm = discord.Embed(title="That's a long name you got there....",
                                      description = "Your nickname is too long! Discord won't let me make you festive.\nChange your nickname and try again",
                                    colour=0xeb6123)  
            spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
            await ctx.send(embed=spookyEm)
        else:
            if nickname.find("🎁") != -1 and nickname.find("⛄") != -1:
                def check(m):
                    if m.author == user and m.channel == ctx.message.channel:
                        if m.content.lower() == "no":
                            raise SaidNoError()
                        elif m.content.lower() == "yes":
                            return True
                        else:
                            return False
                    else:
                        return False
                spookyEm = discord.Embed(title="Ho Ho Ho! You already look pretty festive.",
                                        description = "Are you sure you want to become more festive?", colour=0xeb6123)  
                spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                await ctx.send(embed=spookyEm)
                try:
                    await self.bot.wait_for('message', check=check, timeout=30)
                    try:
                        await user.edit(nick=newNick,reason="IT'S FESTIVE TIME")
                        spookyEm = discord.Embed(title="Ho Ho Ho *jingle sounds*!",
                                            description = f"You're lookin' pretty festive there, {ctx.author.mention}", colour=0xeb6123)  
                        spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                        spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                        await ctx.send(embed=spookyEm)
                    except Exception as e:
                        spookyEm = discord.Embed(title="Uh oh!",
                                            description = "I wasn't able to update your nickname!\nCopy the nickname above and set it manually", colour=0xeb6123)  
                        spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                        spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                        await ctx.send(embed=spookyEm)
                        chanTest = self.bot.get_channel(config['testing_Channel'])
                        await chanTest.send(f"Error festifying {user.mention}\n{e}")
                except SaidNoError:
                    spookyEm = discord.Embed(title="That's fine.",
                                        description = "You can always do it later by running the command again", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    await ctx.send(embed=spookyEm)
                except asyncio.TimeoutError:
                    spookyEm = discord.Embed(title=f"Did you freeze?, {ctx.author.mention}?",
                                        description = "I didn't get a valid answer from you.\nYou can always do it later by running the command again",
                                        colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    await ctx.send(embed=spookyEm)
            else:
                try:
                    await user.edit(nick=newNick,reason="IT'S FESTIVE TIME")
                    spookyEm = discord.Embed(title="Ho Ho Ho!",
                                        description = f"You're lookin' pretty festive there, {ctx.author.mention}", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                    await ctx.send(embed=spookyEm)
                except Exception as e:
                    spookyEm = discord.Embed(title="Uh oh!",
                                        description = "I wasn't able to update your nickname!\nCopy the nickname above and set it manually", colour=0xeb6123)  
                    spookyEm.set_footer(text="Sacarver © 2024 x2110311x", icon_url=self.bot.user.avatar_url)
                    spookyEm.set_author(name=newNick, icon_url=user.avatar_url)
                    await ctx.send(embed=spookyEm)
                    chanTest = self.bot.get_channel(config['testing_Channel'])
                    await chanTest.send(f"Error festifying {user.mention}\n{e}")
    
    
	
    @commands.command(brief=helpInfo['hackerman']['brief'], usage=helpInfo['hackerman']['usage'])
    @commands_check()
    async def hackerman(self, ctx):
        quotelen = len(hackerman.quotes) -1
        chosenquotenum = randint(0,quotelen)
        chosenquote = hackerman.quotes[chosenquotenum]
        hackem = discord.Embed(title=chosenquote,type="rich",colour=0x493388)
        hackem.set_author(name="Hackerman", icon_url="https://i.kym-cdn.com/entries/icons/original/000/021/807/4d7.png")
        await ctx.send(embed=hackem)

    @commands.command(brief=helpInfo['color']['brief'], usage=helpInfo['color']['usage'], aliases=["colour"])
    @commands_check()
    async def color(self, ctx, hexcode):
        try:
            if hexcode[0] == "#":
                hexint = int(hexcode[1:], 16)
            else:
                hexint = int(hexcode, 16)
        except ValueError:
            await ctx.send("That's not a valid color code!")
            return
        if hexcode[0] != "#":
            hexcode = f"#{hexcode}"
        if len(hexcode) != 7:
            await ctx.send("That's not a valid color code!")
            return
        colorObj = xColor(hexcode,'wiki')
        colorName = colorObj.name
        colorImage = Image.new("RGB", (100,100), hexcode)
        imgByteArr = io.BytesIO()
        colorImage.save(imgByteArr, format="PNG")
        imgByteArr.seek(0)
        imgFile = discord.File(fp=imgByteArr, filename="color.png")
        colorEm = discord.Embed(title=hexcode, colour=hexint)
        colorEm.set_image(url="attachment://color.png")
        colorEm.set_author(name=colorName)
        await ctx.send(file=imgFile, embed=colorEm)
        
    @commands.command(brief="Ping among us role")
    @commands.has_role(755594872009916449)
    async def amongus(self, ctx):
        await ctx.send(f"<@&755594872009916449> - Ping requested by {ctx.author.mention}\nhttps://cdn.discordapp.com/attachments/480934371126280202/810375614660870154/FB_IMG_1613278982381.jpg")
    
    @commands.Cog.listener()
    async def on_message(self, message):
        if message.channel.id == 480934371126280202 or message.channel.id == 470337593746259989:
            if message.content.lower() == "f":
                await message.channel.send("Respect has been paid")

    @commands.check
    async def globally_block_dms(self, ctx):
        return ctx.guild is not None

def setup(bot):
    bot.add_cog(Fun(bot))
