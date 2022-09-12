import yaml
import csv
import discord
import asyncio

from discord.ext import commands
from os.path import abspath
from colory.color import Color as xColor

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)


class AprilFools(commands.Cog, name="April Fools Commands"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None
        self.channelData = []
        self.roleData = []

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def gotime(self, ctx):
        await self.load_files()
        await ctx.send("Data loaded")
        guild = ctx.guild

        for channel in self.channelData:
            try:
                chanObj = self.bot.get_channel(int(channel['ID']))
                print(channel)
                await chanObj.edit(name=channel['new'], reason = "April Fools")
            except Exception as e:
                await ctx.send(f"Failed to edit channel - {channel}\n{e}")
        await ctx.send("Channel names updated")

        for role in self.roleData:
            try:
                roleObj = guild.get_role(int(role['ID']))
                print(role)
                await roleObj.edit(name=role['new'], reason = "April Fools")
            except Exception as e:
                await ctx.send(f"Failed to edit role - {channel}\n{e}")
        await ctx.send("Roles Updated")
        
        try:
            with open(abspath('./aprilfools/apico.png'), 'rb') as file:
                icon = file.read()
                await guild.edit(icon=icon, reason="April Fools")
        except Exception as e:
            await ctx.send(f"Couldn't update icon - {e}")

        try:
            with open(abspath('./aprilfools/apbanner.jpg'), 'rb') as file:
                banner = file.read()
                await guild.edit(banner= banner, reason="April Fools")
        except Exception as e:
            await ctx.send(f"Couldn't update banner - {e}")
        
        #await guild.edit(name="Twenty Øne Piløts", reason="April Fools")
        await ctx.send("Server Icon, Banner and Name Updated")

        await ctx.send("Done! Use $notime to undo")
    
    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def cringe(self, ctx):
        guild = ctx.guild
        for channel in guild.channels:
            try:
                name = channel.name.replace("o", "ø")
                name = channel.name.replace("O", "Ø")
                await channel.edit(name=name, reason = "April Fools")
            except:
                print(channel)
        await ctx.send("Ok")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def cringenomore(self, ctx):
        guild = ctx.guild
        for channel in guild.channels:
            try:
                name = channel.name.replace("ø", "o")
                name = channel.name.replace("ø", "O")
                await channel.edit(name=name, reason = "April Fools")
            except:
                print(channel)
        await ctx.send("Ok")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def notime(self, ctx):
        await self.load_files()
        await ctx.send("Data loaded")
        guild = ctx.guild

        for channel in self.channelData:
            try:
                chanObj = self.bot.get_channel(int(channel['ID']))
                await chanObj.edit(name=channel['old'], reason = "April Fools")
            except Exception as e:
                await ctx.send(f"Failed to edit channel - {channel}\n{e}")
        await ctx.send("Channel names updated")

        for role in self.roleData:
            try:
                roleObj = guild.get_role(int(role['ID']))
                await roleObj.edit(name=role['old'], reason = "April Fools")
            except Exception as e:
                await ctx.send(f"Failed to edit role - {channel}\n{e}")
        await ctx.send("Roles Updated")
        try:
            with open(abspath('./aprilfools/apico-old.gif'), 'rb') as file:
                icon = file.read()
                await guild.edit(icon=icon, reason="April Fools")
        except Exception as e:
            await ctx.send(f"Couldn't update icon - {e}")

        try:
            with open(abspath('./aprilfools/apbanner-old.jpg'), 'rb') as file:
                banner = file.read()
                await guild.edit(banner= banner, reason="April Fools")
        except Exception as e:
            await ctx.send(f"Couldn't update banner - {e}")
        
        await guild.edit(name="twenty one pilots", reason="April Fools")
        await ctx.send("Server Icon, Banner and Name Updated")

        await ctx.send("Done!")

    
    @commands.Cog.listener()
    async def on_message(self, message):
        if message.content.lower().find("joshler") != -1:
            await message.add_reaction("🤢")

    async def load_files(self):
        self.roleData.clear()
        self.channelData.clear()

        with open(abspath("./aprilfools/channels.csv")) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            line_count = 0
            for row in csv_reader:
                if line_count == 0:
                    print(f'Column names are {", ".join(row)}')
                else:
                    entry = {
                       "ID" : row[0],
                       "old": row[1],
                       "new": row[2]
                    }
                    self.channelData.append(entry)
                
                line_count += 1
            print(f"{line_count} channels")
        
        print("Channel file finished")

        with open(abspath("./aprilfools/roles.csv")) as csv_file:
            csv_reader = csv.reader(csv_file, delimiter=',')
            line_count = 0
            for row in csv_reader:
                if line_count == 0:
                    print(f'Column names are {", ".join(row)}')
                else:
                    entry = {
                       "ID" : row[0],
                       "old": row[1],
                       "new": row[2]
                    }
                    self.roleData.append(entry)
                
                line_count += 1
            print(f"{line_count} roles")
        print("Role file finished")

def setup(bot):
    bot.add_cog(AprilFools(bot))
