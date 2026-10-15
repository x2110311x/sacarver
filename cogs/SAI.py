import yaml
import discord
import asyncio
import aiomysql
import pymysql
import math
from random import randint
from PIL import Image
from PIL import ImageDraw
import numpy
from blend_modes import multiply
import io
import requests
from discord.ext import commands
from os.path import abspath
from include import DB

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

class SaidNoError(Exception):
    pass

class SAI(commands.Cog, name="SAI Commands"):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        self.DBConn = await DB.connect()

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        if payload.emoji.id == 832772733002973195 and payload.message_id == 845034835394560061:
            server = self.bot.get_guild(269657133673349120)
            sairole = server.get_role(845028364414877736)
            await payload.member.add_roles(sairole, reason="SAI LIVE REACTION")
            try:
                await payload.member.send("You've added the SAI LIVE ANNOUNCEMENTS role.")
            except:
                pass
        elif payload.message_id == 845034835394560061:
            server = self.bot.get_guild(269657133673349120)
            sairole = server.get_role(845028364414877736)
            await payload.member.remove_roles(sairole, reason="SAI LIVE REACTION")
            try:
                await payload.member.send("You've removed the SAI LIVE ANNOUNCEMENTS role.")
            except:
                pass

    @commands.command()
    async def saipfp(self, ctx):
        if len(ctx.message.attachments) > 0:
            sai = Image.open(abspath("./include/images/sai.png")).convert("RGBA")
            mask = Image.open(abspath("./include/images/saimask.png")).resize(sai.size).convert('L')
            pink = Image.new("RGB", (512,512), 11172592).convert("RGBA")
            received = requests.get(ctx.message.attachments[0].url)
            try:
                receivedImage = Image.open(io.BytesIO(received.content)).convert('L').convert("RGBA")
                receivedImage.thumbnail((512, 512), Image.ANTIALIAS)
                if receivedImage.size[0] < 512:
                    x = 512
                    y = int(receivedImage.size[1]/receivedImage.size[0] * x)
                if receivedImage.size[1] < 512:
                    y = 512
                    x = int(receivedImage.size[0]/receivedImage.size[1] * y)
                else:
                    x = 512
                    y = 512
                receivedImage = receivedImage.resize((x, y), Image.ANTIALIAS)
                if receivedImage.size[0] > 512:
                    excess = math.ceil((receivedImage.size[0] - 512)/2)
                    receivedImage = receivedImage.crop((excess, 0, receivedImage.size[0] - excess, receivedImage.size[1]))
                if receivedImage.size[1] > 512:
                    excess = math.ceil((receivedImage.size[1] - 512)/2)
                    receivedImage = receivedImage.crop((0, excess, receivedImage.size[0], receivedImage.size[1] - excess))
                receivedImage = receivedImage.resize((512, 512), Image.ANTIALIAS)
                background_img = numpy.array(receivedImage)
                background_img_float = background_img.astype(float)    
                foreground_img = numpy.array(pink) 
                foreground_img_float = foreground_img.astype(float)  

                final = multiply(background_img_float, foreground_img_float, .95)
                blended_img = numpy.uint8(final)
                blended_img_raw = Image.fromarray(blended_img)
                blended_img_raw.paste(sai, mask)
                imgByteArr = io.BytesIO()
                blended_img_raw.save(imgByteArr, format='PNG')
                imgByteArr.seek(0)
                sendFile = discord.File(fp=imgByteArr, filename="pfp.png")
                await ctx.send(file=sendFile)
            except Exception as e:
                await ctx.send(f"I'm having some trouble generating the image\n```{e}```")
        else:
            await ctx.send("Please send an image!")


    @commands.command()
    async def fitcheck(self, ctx):
        if len(ctx.message.attachments) > 0:
            backdrop = Image.open(abspath("./include/images/tylerframe.png"))
            mask = Image.open(abspath("./include/images/mask.png")).resize(backdrop.size).convert('L')
            received = requests.get(ctx.message.attachments[0].url)
            try:
                receivedImage = Image.open(io.BytesIO(received.content))
                receivedImage = receivedImage.resize((430, 630), Image.ANTIALIAS)
                newImg = Image.new("RGBA", (1154, 2048))
                newImg.paste(receivedImage, (735, 1000))
                newImg.paste(backdrop, (0, 0),mask)
                imgByteArr = io.BytesIO()
                newImg.save(imgByteArr, format='PNG')
                imgByteArr.seek(0)
                sendFile = discord.File(fp=imgByteArr, filename="fitcheck.png")
                await ctx.send(file=sendFile)
            except:
                await ctx.send("I'm having some trouble generating the image")
        else:
            await ctx.send("Please send an image!")

    @commands.command()
    async def fitcheck2(self, ctx):
        if len(ctx.message.attachments) > 0:
            backdrop = Image.open(abspath("./include/images/tylerframe.png"))
            mask = Image.open(abspath("./include/images/mask.png")).resize(backdrop.size).convert('L')
            received = requests.get(ctx.message.attachments[0].url)
            try:
                receivedImage = Image.open(io.BytesIO(received.content))
                receivedImage.thumbnail((430, 630), Image.ANTIALIAS)
                print(receivedImage.size)
                if receivedImage.size[0] < 430:
                    x = 430
                    y = int(receivedImage.size[1]/receivedImage.size[0] * x)
                elif receivedImage.size[1] < 630:
                    y = 630
                    x = int(receivedImage.size[0]/receivedImage.size[1] * y)
                else:
                    x = 430
                    y = 630
                receivedImage = receivedImage.resize((x, y), Image.ANTIALIAS)
                print(receivedImage.size)
                if receivedImage.size[0] > 430:
                    excess = int((receivedImage.size[0] - 430)/2)
                    print(excess)
                    receivedImage = receivedImage.crop((excess, 0, receivedImage.size[0] - excess, receivedImage.size[1]))
                if receivedImage.size[1] > 630:
                    excess = int((receivedImage.size[1] - 630)/2)
                    print(excess)
                    receivedImage = receivedImage.crop((0, excess, receivedImage.size[0], receivedImage.size[1] - excess))
                print(receivedImage.size)
                newImg = Image.new("RGBA", (1154, 2048))
                newImg.paste(receivedImage, (735, 1000))
                newImg.paste(backdrop, (0, 0),mask)
                imgByteArr = io.BytesIO()
                newImg.save(imgByteArr, format='PNG')
                imgByteArr.seek(0)
                sendFile = discord.File(fp=imgByteArr, filename="fitcheck.png")
                await ctx.send(file=sendFile)
            except:
                await ctx.send("I'm having some trouble generating the image")
        else:
            await ctx.send("Please send an image!")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def updatething(self, ctx):
        await ctx.send("Updating da SAI LIVE roles. This may take some time")
        campoutstart = ctx.channel.guild.get_channel(845027233570488350)
        sairole = ctx.channel.guild.get_role(845028364414877736)
        nico = self.bot.get_user(470410168186699788)
        msg = discord.utils.get(await campoutstart.history(limit=100).flatten(), author=nico)
        for react in msg.reactions:
            try:
                if react.emoji.id == 832772733002973195:
                    async for user in react.users():
                        if user.id != 470410168186699788:
                            try:
                                await user.add_roles(sairole, reason="SAI LIVE REACTION")
                                await react.remove(user)
                            except:
                                pass
            except:
                if react.emoji == "❌":
                    async for user in react.users():
                        if user.id != 470410168186699788:
                            try:
                                await user.remove_roles(sairole, reason="SAI LIVE REACTION")
                                await react.remove(user)
                            except:
                                pass
        await ctx.send("Done w/ da SAI LIVE roles.")

    @commands.command()
    async def jackbox(self, ctx):
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
        guild = ctx.message.channel.guild
        fb = guild.get_role(283272728084086784)
        level50 = guild.get_role(449654893108527114)
        level100 = guild.get_role(449654945076215828)
        levelReq = 0
        if fb in ctx.message.author.roles: # or level50 in ctx.message.author.roles or level100 in ctx.message.author.roles:
            levelReq = 1
        insertSQL = f"INSERT INTO Jackbox (userID, levelReq) VALUES ({ctx.message.author.id}, {levelReq});"
        try:
            await DB.execute(insertSQL, self.DBConn)
            await ctx.send("You've been entered into the Jackbox pool.\n`NOTE: You must be in voice chat when we pick`")
        except:
            await ctx.send("It seems you're already in the pool! Would you like to be removed?")
            try:
                await self.bot.wait_for('message', check=check, timeout=120)
                try:
                    await DB.execute(f"DELETE FROM Jackbox WHERE userID = {ctx.message.author.id}", self.DBConn)
                    await ctx.send("Okay. You have been removed.")
                except Exception as e:
                    await ctx.send(f"I seem to have had some trouble removing you\nError:```{e}```")
            except SaidNoError:
                await ctx.send("Alright. You are still in the pool")
            except asyncio.TimeoutError:
                await ctx.send("I did not get a valid response. You are still in the Jackbox pool")
    
    @commands.command(usage="[Jackbox Code] [Number of players to pick]")
    @commands.has_role(config['staff_Role'])
    async def pick_jackbox(self, ctx, code, players: int):
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
        userSelect = "SELECT * FROM Jackbox WHERE levelReq = 1;"
        guild = ctx.message.channel.guild
        vc = guild.get_role(465268535543988224)
        try:
            pool = await DB.select_all(userSelect, self.DBConn)
        except Exception as e:
            print(e)
            await ctx.send(f"Error retrieving user pool\n{e}")
        try:
            if len(pool) >= players:
                picked = []
                for x in range(0, players):
                    chosenIndex = randint(0, len(pool)-1)
                    chosen = pool[chosenIndex]
                    chosen = guild.get_member(chosen[0])
                    while chosen in picked or (chosen.voice is None or chosen.voice.channel.id != 470337319610875904):
                        chosenIndex = randint(0, len(pool)-1)
                        chosen = pool[chosenIndex]
                        chosen = guild.get_member(chosen[0])
                    picked.append(chosen)
                pickedMsg = "Chosen peeps:\n"
                for person in picked:
                    pickedMsg += f"{person.mention}\n"
                pickedMsg += "\n Do you accept these players?" 
                await ctx.send(pickedMsg)
                try:
                    await self.bot.wait_for('message', check=check, timeout=120)
                    await ctx.send("Okay. DMing users the code")
                    for person in picked:
                        try:
                            await person.send(f"You have been selected to join Jackbox.\nYou may join using this code: `{code}`")
                        except:
                            await ctx.send(f"Couldn't DM {person.mention}")
                except SaidNoError:
                    await ctx.send("Alright. Well use the command again, mf")
                except asyncio.TimeoutError:
                    await ctx.send("Timeout reached. Try again later.")
            else:
                await ctx.send("yeah so here's the thing. We don't got enough people")
        except Exception as e:
            print(e)
            await ctx.send(f"I'm having some trouble rn sorry\n{e}")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def clear_reacts(self, ctx):
        await ctx.send("Clearing excess reacts")
        campoutstart = ctx.channel.guild.get_channel(845027233570488350)
        nico = self.bot.get_user(470410168186699788)
        msg = discord.utils.get(await campoutstart.history(limit=100).flatten(), author=nico)
        for react in msg.reactions:
            try:
                if react.emoji.id == 832772733002973195:
                    async for user in react.users():
                        if user.id != 470410168186699788:
                            await react.remove(user)
            except:
                if react.emoji == "❌":
                    async for user in react.users():
                        if user.id != 470410168186699788:
                            await react.remove(user)
        await ctx.send("Done w/ Clearing excess reacts")

def setup(bot):
    bot.add_cog(SAI(bot))
