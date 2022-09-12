import yaml
import discord
import asyncio
import aiomysql
import pymysql
from random import randint

from discord.ext import commands
from os.path import abspath

from include import DB

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

class Giveaway(commands.Cog, name="Giveaway Commands"):
    def __init__(self, bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        self.DBConn = await DB.connect()

    @commands.command()
    async def giveaway(self, ctx):
        await ctx.send("The giveaway is now closed.")

    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def pick_winners(self, ctx):
        giveawaySelect = "SELECT * FROM discordclique.Giveaway;"
        try:
            enteredUsers = await DB.select_all(giveawaySelect, self.DBConn)
        except:
            await ctx.send("Error retrieving entries")
        try:
            if len(enteredUsers) > 8:
                winners = []
                for x in range(0,8):
                    chosenWinnerIndex = randint(0, len(enteredUsers)-1)
                    chosenWinner = enteredUsers[chosenWinnerIndex]
                    while chosenWinner in winners:
                        chosenWinnerIndex = randint(0, len(enteredUsers)-1)
                        chosenWinner = enteredUsers[chosenWinnerIndex]
                    winners.append(chosenWinner)
                winnerMsg = f"Winners selected!\n"
                for winner in winners:
                    winnerMsg += f"<@{winner[0]}> - ig: {winner[1]}\n"
                winnerMsg += "\nPlease verify they are following DC"
                await ctx.send(winnerMsg)
            else:
                await ctx.send("Sorry. No one actually entered")
        except Exception as e:
            await ctx.send(f"Error picking winners{e}")

    
    @commands.command()
    @commands.has_role(config['staff_Role'])
    async def totalentries(self, ctx):
        entries = await DB.select_one("SELECT COUNT(*) FROM Giveaway;", self.DBConn)
        await ctx.send(f"There have been {entries[0]} entries so far")

def setup(bot):
    bot.add_cog(Giveaway(bot))
