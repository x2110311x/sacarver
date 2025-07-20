import discord
import time
import yaml
import asyncio
import aiohttp
import json
from urllib import parse, request
from random import randint


from datetime import datetime
from discord.ext import commands
from os.path import abspath

with open(abspath('./include/config.yml'), 'r') as configFile:
    config = yaml.safe_load(configFile)

forbiddenNicknamePhrases = ['freegene', 'freejup', 'freeoat']

class AuditLogs(commands.Cog, name="Audits"):
    def __init__(self, bot):
        self.bot = bot
        self._last_member = None

    @commands.Cog.listener()
    async def on_message(self, message):
        if message.channel.id == 470406597860917249 and message.webhook_id is None:
            member = message.author
            guild = self.bot.get_guild(config['server_ID'])
            staff = guild.get_role(config['staff_Role'])
            if staff not in member.roles:
                embedJoin = discord.Embed(colour=0x753543, title="User Passed Member Screening")
                embedJoin.set_author(name=member.name, icon_url=member.avatar_url)
                embedJoin.add_field(name="User ID", value=f"{member.id}", inline=False)
                datePassed = datetime.utcfromtimestamp(int(time.time())).strftime("%m/%d/%Y, %H:%M:%S") + " UTC"
                embedJoin.add_field(name="Passed At", value=datePassed, inline=False)
                embedJoin.set_footer(text=f"© x2110311x.")
                joinLeaveLog = self.bot.get_channel(config['join-leave-log'])
                await joinLeaveLog.send(embed=embedJoin)
                joinRole = guild.get_role(269660541738418176)
                newRole = guild.get_role(430170511385952267)
                '''try:
                    await member.add_roles(joinRole, reason="User Join")
                    await member.add_roles(newRole, reason="User Join")
                except Exception as e:
                    chanTest = self.bot.get_channel(470406597860917249)
                    await chanTest.send(f"Unable to add roles for {member.mention} - {e}")'''

    @commands.Cog.listener()
    async def on_member_join(self, member):
        embedJoin = discord.Embed(colour=0x753543, title="User Joined")
        embedJoin.set_author(name=member.name, icon_url=member.avatar_url)
        embedJoin.add_field(name="User ID", value=f"{member.id}", inline=False)
        dateJoined = member.joined_at.strftime("%m/%d/%Y, %H:%M:%S") + " UTC"
        embedJoin.add_field(name="Joined At", value=dateJoined, inline=False)
        dateCreated = member.created_at.strftime("%m/%d/%Y, %H:%M:%S") + " UTC"
        shouldKick = False
        if int(time.time()) -604800 < member.created_at.timestamp():
            dateCreated += "\n***ACCOUNT CREATED LESS THAN 1 WEEK AGO***"
        embedJoin.add_field(name="User Account Created At", value=dateCreated, inline=False)
        embedJoin.set_footer(text=f"© x2110311x.")

        joinLeaveLog = self.bot.get_channel(config['join-leave-log'])
        await joinLeaveLog.send(embed=embedJoin)

        if member.display_name.lower().find("tastic2000") != -1 or member.display_name.lower().find("tastic3000") != -1:
            staff = self.bot.get_channel(config['chat-mod'])
            await member.ban(reason="tomatotastic2000")
            await staff.send(f"{member.mention} detected and banned")

        if shouldKick:
            try:
                await member.dm("We are currently getting bot raided and your account appears suspicious. As of such, you have been kicked")
            except:
                pass
            
            await member.kick(reason="Spam Bot")
            banLog = self.bot.get_channel(689685441485733952)
            await banLog.send(f"{member.mention} appears to be a spam bot and has been kicked")


    @commands.Cog.listener()
    async def on_voice_state_update(self, member, before, after):
        guild = self.bot.get_guild(config['server_ID'])
        vcLog = guild.get_channel(config['vc-log'])
        vc = guild.get_role(465268535543988224)

        if before.channel is None and after.channel is not None:
            embed=discord.Embed(title="User Joined VC", color=0x01b725)
            embed.add_field(name="Channel ID", value=after.channel.id, inline=False)
            embed.add_field(name="Channel Name", value=after.channel.name, inline=False)
            await asyncio.sleep(2)
            if vc not in member.roles:
                await member.add_roles(vc)
        elif before.channel is not None and after.channel is None:
            embed=discord.Embed(title="User Left VC", color=0x01b725)
            embed.add_field(name="Channel ID", value=before.channel.id, inline=False)
            embed.add_field(name="Channel Name", value=before.channel.name, inline=False)
            await asyncio.sleep(2)
            if vc in member.roles:
                await member.remove_roles(vc)
        elif before.channel is not None and after.channel is not None and before.channel != after.channel:
            embed=discord.Embed(title="User Moved VC", color=0x01b725)
            embed.add_field(name="Old Channel ID", value=before.channel.id, inline=False)
            embed.add_field(name="Old Channel Name", value=before.channel.name, inline=False)
            embed.add_field(name="New Channel ID", value=after.channel.id, inline=False)
            embed.add_field(name="New Channel Name", value=after.channel.name, inline=False)
        embed.set_author(name=member.display_name, icon_url=member.avatar_url)
        embed.add_field(name="User ID", value=member.id, inline=False)
        dateLeft = datetime.utcfromtimestamp(int(time.time())).strftime("%m/%d/%Y, %H:%M:%S") + " UTC"
        embed.add_field(name="Time", value=dateLeft, inline=False)
        embed.set_footer(text="© 2024 x2110311x")
        await vcLog.send(embed=embed)

    @commands.Cog.listener()
    async def on_member_remove(self, member):
        embedLeave = discord.Embed(colour=0x753543, title="User Left")
        embedLeave.set_author(name=member.name, icon_url=member.avatar_url)
        embedLeave.add_field(name="User ID", value=f"{member.id}", inline=False)
        dateLeft = datetime.utcfromtimestamp(int(time.time())).strftime("%m/%d/%Y, %H:%M:%S") + " UTC"
        embedLeave.add_field(name="Left At", value=dateLeft, inline=False)
        embedLeave.set_footer(text=f"© x2110311x.")

        joinLeaveLog = self.bot.get_channel(config['join-leave-log'])
        await joinLeaveLog.send(embed=embedLeave)

    @commands.Cog.listener()
    async def on_member_update(self, before, after):
        guild = self.bot.get_guild(config['server_ID'])
        newRole = guild.get_role(config['new_member_Role'])
        if newRole in after.roles:
            joinDate = after.joined_at
            now = datetime.now()
            memberAge = now - joinDate
            if (memberAge.total_seconds()/3600) > 6:
                await after.remove_roles(newRole, reason="Member age is greater than 6 hours")
        if after.id == 463063308191137822:
            if before.status != after.status:
                timestamp = int(time.time())
                dTimestamp = f"<t:{timestamp}:F"
                guild = self.bot.get_guild(config['server_ID'])
                staffChan = guild.get_channel(1379620414699081818)
                e = discord.Embed(title="Mark status change detected", description=f"Status changed from {before.status} to {after.status}", color=0x5a1b85)
                #e.set_thumbnail(url="https://media1.tenor.com/m/OxKCcYCz1-UAAAAd/tommy-wiseau.gif")
                await staffChan.send(embed=e)
        if before.nick != after.nick:
            nicknameChanged = False
            if after.nick is not None:
                for phrase in forbiddenNicknamePhrases:
                    if after.nick.lower().find(phrase) != -1:
                        nicknameChanged = True
                        bannedIndex = after.nick.lower().find(phrase)
                        bannedPhase = after.nick[bannedIndex-1:bannedIndex+len(phrase)+1]
                        newNick = after.nick.replace(bannedPhase,"")
                        await after.edit(nick=newNick)

            if nicknameChanged:
                embed=discord.Embed(title="User Changed Nickname - BANNED PHRASE", color=0xFF0000)
                embed.add_field(name="Banned Phrase Used", value=bannedPhase, inline=False)
            else:
                embed=discord.Embed(title="User Changed Nickname", color=0x01b725)
                embed.add_field(name="Previous nickname", value=before.display_name, inline=False)
                embed.add_field(name="Current nickname", value=after.display_name, inline=False)
            embed.add_field(name="User ID", value=after.id, inline=False)
            embed.set_author(name=after.display_name, icon_url=after.avatar_url)
            guild = self.bot.get_guild(config['server_ID'])
            nickLog = guild.get_channel(config['nick-log'])
            await nickLog.send(embed=embed)

    async def process_delete(self, payload):
        guild = self.bot.get_guild(config['server_ID'])
        deleteLog = guild.get_channel(config['delete-log'])
        embed=discord.Embed(title="Message Deleted", color=0x01b725)
        embed.add_field(name="Channel", value=f"<#{payload.channel_id}> - {payload.channel_id}", inline=False)
        embed.add_field(name="Message ID", value=payload.message_id, inline=False)
        embed.set_footer(text="© 2024 x2110311x")
        if payload.cached_message is not None:
            msg = payload.cached_message
            embed.set_author(name=msg.author.display_name, icon_url=msg.author.avatar_url)
            embed.add_field(name="User ID", value=msg.author.id, inline=False)
            embed.add_field(name="Message Text", value=msg.content, inline=False)
        else:
            embed.add_field(name="Message Text", value="*Message was not cached*", inline=False)
        embed.add_field(name="Time Deleted", value=datetime.now().strftime("%b %d, %Y - %I:%M:%S %P") + " UTC", inline=False)
        await deleteLog.send(embed=embed)

    """     @commands.Cog.listener()
    async def on_raw_message_delete(self, payload):
        guild = self.bot.get_guild(config['server_ID'])
        deleteLog = guild.get_channel(config['delete-log'])
        log = True
        if log:
            embed=discord.Embed(title="Message Deleted", color=0x01b725)
            embed.add_field(name="Channel", value=f"<#{payload.channel_id}> - {payload.channel_id}", inline=False)
            embed.add_field(name="Message ID", value=payload.message_id, inline=False)
            embed.set_footer(text="© 2024 x2110311x")
            if payload.cached_message is not None:
                msg = payload.cached_message
                embed.set_author(name=msg.author.display_name, icon_url=msg.author.avatar_url)
                embed.add_field(name="User ID", value=msg.author.id, inline=False)
                embed.add_field(name="Message Text", value=msg.content, inline=False)
            else:
                embed.add_field(name="Message Text", value="*Message was not cached*", inline=False)
            embed.add_field(name="Time Deleted", value=datetime.now().strftime("%b %d, %Y - %I:%M:%S %P") + " UTC", inline=False)
            await deleteLog.send(embed=embed)
    """
    """     @commands.Cog.listener()
    async def on_raw_message_edit(self, payload):
        guild = self.bot.get_guild(config['server_ID'])
        editLog = guild.get_channel(config['edit-log'])
        embed=discord.Embed(title="Message Edited", color=0x01b725)
        embed.add_field(name="Channel", value=f"<#{payload.channel_id}> - {payload.channel_id}", inline=False)
        embed.add_field(name="Message ID", value=payload.message_id, inline=False)
        channel = guild.get_channel(payload.channel_id)
        msg = await channel.fetch_message(payload.message_id)
        embed.add_field(name="New Message Text", value=msg.content, inline=False)
        embed.set_footer(text="© 2024 x2110311x")
        if payload.cached_message is not None:
            oldmsg = payload.cached_message
            if oldmsg.author.bot:
                return
            embed.set_author(name=oldmsg.author.display_name, icon_url=oldmsg.author.avatar_url)
            embed.add_field(name="Old Message Text", value=oldmsg.content, inline=False)
        else:
            embed.add_field(name="Old Message Text", value="*Message was not cached*", inline=False)
        embed.add_field(name="Time Edited", value=datetime.now().strftime("%b %d, %Y - %I:%M:%S %P") + " UTC", inline=False)

        await editLog.send(embed=embed)
    """
    @commands.check
    async def globally_block_dms(ctx):
        return ctx.guild is not None

    @commands.Cog.listener()
    async def on_raw_bulk_message_delete(self, payload):
        messages = payload.message_ids
        channel = payload.channel_id
        for message in payload.cached_messages:
            messages.remove(message.id)
            await self.send_delete_log_cached(message)
        for message in payload.message_ids:
            await self.send_delete_log_not_cached(message, channel)

    async def send_delete_log_cached(self, message):
        guild = self.bot.get_guild(config['server_ID'])
        deleteLog = guild.get_channel(config['delete-log'])
        embed=discord.Embed(title="Message Deleted", color=0x01b725)
        embed.add_field(name="Channel", value=f"<#{message.channel.id}> - {message.channel.id}", inline=False)
        embed.add_field(name="Message ID", value=message.id, inline=False)
        embed.set_footer(text="© 2024 x2110311x")
        embed.set_author(name=message.author.display_name, icon_url=message.author.avatar_url)
        embed.add_field(name="User ID", value=message.author.id, inline=False)
        embed.add_field(name="Message Text", value=message.content, inline=False)
        await deleteLog.send(embed=embed)
    
    async def send_delete_log_not_cached(self, message_id, channel_id):
        guild = self.bot.get_guild(config['server_ID'])
        deleteLog = guild.get_channel(config['delete-log'])
        embed=discord.Embed(title="Message Deleted", color=0x01b725)
        embed.add_field(name="Channel", value=f"<#{channel_id}> - {channel_id}", inline=False)
        embed.add_field(name="Message ID", value=message_id, inline=False)
        embed.set_footer(text="© 2024 x2110311x")
        embed.add_field(name="Message Text", value="*Message was not cached*", inline=False)
        embed.add_field(name="Time Deleted", value=datetime.now().strftime("%b %d, %Y - %I:%M:%S %P") + " UTC", inline=False)
        await deleteLog.send(embed=embed)

def setup(bot):
    bot.add_cog(AuditLogs(bot))


def get_gif():
    url = "http://api.giphy.com/v1/gifs/search"

    params = parse.urlencode({
    "q": "Reel",
    "api_key": "DFYx7mnIjXfR73g2zX0AqjOOnRu3ZA2n",
    "limit": "75"
    })

    with request.urlopen("".join((url, "?", params))) as response:
        data = json.loads(response.read())
    return(data['data'][randint(0,75)]['images']['original']['url'])
