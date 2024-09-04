import discord
import yaml


from discord.ext import commands
from os.path import abspath, join

# General Variables #
with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

class JoinLeave(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None

    @commands.Cog.listener()
    async def on_member_join(self, member):
        # Update Status #
        guild = self.bot.get_guild(config['server_ID'])
        joinRole = guild.get_role(269660541738418176)
        newRole = guild.get_role(430170511385952267)
        try:
            memberStatus = discord.Activity(type=discord.ActivityType.competing, name=f"{guild.member_count - config['botCount']} members")
            await self.bot.change_presence(status=discord.Status.online, activity=memberStatus)
            await member.add_roles(joinRole, newRole)
        except:
            pass
        if member.created_at.timestamp() > 1626048000 and member.created_at.timestamp() < 1626393600:
            if member.default_avatar_url == member.avatar_url:
                print('true')
                await member.ban(reason="Part of bot raid")
                await self.chanTest.send(f"Banned {member.mention} on join") 

        staffchannel = self.bot.get_channel(470324442082312192)
        if guild.member_count ==  69000:
            await staffchannel.send("<@&330877657132564480> <@207129652345438211> 69k")
        if guild.member_count == 69420:
            await staffchannel.send("<@&330877657132564480> <@207129652345438211> 69420")

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        # Update Status #
        guild = self.bot.get_guild(config['server_ID'])
        memberStatus = discord.Activity(type=discord.ActivityType.watching, name=f"{guild.member_count - config['botCount']} members")
        await self.bot.change_presence(status=discord.Status.online, activity=memberStatus)

    @commands.check
    async def globally_block_dms(self, ctx):
        return ctx.guild is not None

    @commands.Cog.listener()
    async def on_ready(self):
        self.chanTest = self.bot.get_channel(config['testing_Channel'])

def setup(bot):
    bot.add_cog(JoinLeave(bot))

