import yaml
import discord
import asyncio
from discord.ext import commands
from io import BytesIO
from PIL import Image
from os.path import abspath
from os import remove
from google_images_search import GoogleImagesSearch

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

with open(abspath(config['help_file']), 'r') as helpFile:
    helpInfo = yaml.safe_load(helpFile)

helpInfo = helpInfo['Staff']

shutdownChans = [470330055063633920,470330688235765770,470330491816509449,470380663682367488,487830419149029376,
            700107557766692864,470425013770649600,470451678294835200,641087479293935642,470331336511717376,
            470435985788764179,478970958615412746,470331990231744512,470421876976517141,470335358970757145,
            470335381766668288,470434533884297216,470335772084666389,693592071012876349,470335805697556480,
            470337020431171595,470714580935639041,536828256247218176,500492908122865664,470339161967165440,
            689322666234216456,689548218828455967]

raidmodeChans = [700107557766692864,470425013770649600,470451678294835200,641087479293935642,470331336511717376,
            470435985788764179,478970958615412746,470331990231744512,470421876976517141,470335358970757145,
            470335381766668288,470434533884297216,470335772084666389,693592071012876349,470335805697556480,
            470337020431171595,470714580935639041,536828256247218176,500492908122865664,470339161967165440,
            689322666234216456,689548218828455967]

raidmodeLock = [470330055063633920,470330688235765770,470330491816509449,470380663682367488,487830419149029376]
class SaidNoError(Exception):
    pass

class Staff(commands.Cog, name="Staff Commands"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None

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
            if bandito not in member.roles and muted not in member.roles and member.id != 115385224119975941:
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
    async def status(self, ctx, *, statusmsg="Member count"):
        if statusmsg.lower() == "member count":
            guild = self.bot.get_guild(config['server_ID'])
            await self.bot.change_presence(status=discord.Status.online, activity=discord.Game(f"with {guild.member_count - config['botCount']} members"))
        else:
            await self.bot.change_presence(status=discord.Status.online, activity=discord.Game(statusmsg))

    @commands.command(brief=helpInfo['say']['brief'], usage=helpInfo['say']['usage'])
    @commands.has_role(config['staff_Role'])
    async def say(self, ctx, channel: discord.TextChannel = None, *, textToSay):
        if channel is None:
            channel = ctx.channel
        await channel.send(textToSay)
        await ctx.message.delete()

    @commands.command(brief=helpInfo['userinfo']['brief'], usage=helpInfo['userinfo']['usage'])
    @commands.has_role(config['staff_Role'])
    async def userinfo(self, ctx, *, user: discord.Member):
        joinDate = user.joined_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        createdDate = user.created_at.strftime("%m/%d/%Y, %H:%M:%S") + " GMT"
        userRoles = user.roles
        rolestr = ""
        for role in userRoles:
            if role.id != config['server_ID']:
                rolestr += f"{role.mention}, "
        rolestr = rolestr[:len(rolestr) - 2]
        embedInfo = discord.Embed(colour=0x753543)
        embedInfo.set_author(name=user.name, icon_url=user.avatar_url)
        embedInfo.add_field(name="User ID", value=user.id, inline=False)
        embedInfo.add_field(name="Last Join Date", value=joinDate, inline=False)
        embedInfo.add_field(name="Account Creation Date", value=createdDate, inline=False)
        embedInfo.add_field(name="roles", value=rolestr, inline=False)

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

    @commands.Cog.listener()
    async def on_message(self, message):
        if len(message.mentions) >= 20 and message.author.id != 470691679712706570:
            offender = message.author
            await offender.send(f"You have been automatically banned for mentioning {len(message.mentions)} people. DM nakpin#3005 to appeal")
            await offender.send("https://cdn.discordapp.com/emojis/648569239489216534.png")
            await offender.ban()
            staffChan = self.bot.get_channel(470324442082312192)
            await staffChan.send(f"{offender.mention} has been automatically banned for mentioning {len(message.mentions)} people.")
            await message.delete()
        elif len(message.mentions) >= 10 and message.author.id != 470691679712706570:
            offender = message.author
            server = self.bot.get_guild(269657133673349120)
            banditos = server.get_role(269660541738418176)
            muted = server.get_role(278225702455738368)
            await offender.remove_roles(banditos)
            await offender.add_roles(muted)
            await offender.send(f"You have been automatically muted for mentioning {len(message.mentions)} people. DM a staff member if you believe this to be a mistake.")
            staffChan = self.bot.get_channel(470324442082312192)
            await staffChan.send(f"{offender.mention} has been automatically muted for mentioning {len(message.mentions)} people.")
            await message.delete()
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
