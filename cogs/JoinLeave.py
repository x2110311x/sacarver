import discord
import yaml


from discord.ext import commands
from os.path import abspath

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
        memberStatus = discord.Activity(type=discord.ActivityType.watching, name=f"{guild.member_count - config['botCount']} members")
        await self.bot.change_presence(status=discord.Status.online, activity=memberStatus)

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        # Update Status #
        guild = self.bot.get_guild(config['server_ID'])
        memberStatus = discord.Activity(type=discord.ActivityType.watching, name=f"{guild.member_count - config['botCount']} members")
        await self.bot.change_presence(status=discord.Status.online, activity=memberStatus)

    @commands.check
    async def globally_block_dms(self, ctx):
        return ctx.guild is not None


def setup(bot):
    bot.add_cog(JoinLeave(bot))
