#import needed modules
import discord
from time import time, sleep
import datetime
import random
import os
from threading import Timer
import csv
import string
from google_images_download import google_images_download
from include import config, utilities

#General variables for code execution
starttime = time()
client = discord.Client()
memberstatus = True
chanbandict = []
with open('chanban.csv') as File:
	csvreader = csv.DictReader(File)
	for row in csvreader:
		chanbandict.append(row)

def restart(): #restart
    os.system('/bots/sacarver/bashscripts/restart.sh')
restartT = Timer(43200.0, restart)

#update status and check for channel bans
@client.event
async def on_member_join(member):
	server = client.get_server('269657133673349120')
	if memberstatus == True:
		await client.change_presence(game=discord.Game(name='with {} members'.format(server.member_count)))
	for dict in chanbandict:
		if str(dict['memid']) == member.id:
			chantoban = client.get_channel(dict['chanid'])
			memtoban =discord.utils.get(server.members, id=dict['memid'])
			overwrite = discord.PermissionOverwrite()
			overwrite.read_messages = False
			overwrite.send_messages = False
			await client.edit_channel_permissions(chantoban,memtoban,overwrite)

#All the commands
@client.event
async def on_message(message):
	#Grab needed varibles for commands
	server = client.get_server(config.serverid)
	staff = discord.utils.get(server.roles, id=config.roles['staff'])
	LD = discord.utils.get(server.roles, id=config.roles['banditos'])
	hometown = client.get_channel(config.channels['hometown'])
	commandschan = client.get_channel(config.channels['commands'])
	staffserious = client.get_channel(config.channels['staffserious'])
	stafffun = client.get_channel(config.channels['staffcasual'])
	testchannel = client.get_channel(config.channels['testchannel'])
	submittedsuggestions = client.get_channel(config.channels['submittedsuggestions'])
	DE = client.get_channel(config.roles['DE'])

	channel = message.channel

	#Add reacts for voting on last straw
	if message.content.find("last straw") != -1 and message.channel == staffserious and message.content.find("?")!= -1:
		await client.add_reaction(message, "⬆")
		await client.add_reaction(message, "⬇")

	#General commands. Check to make sure user is not blocked, and the command isn't being used in hometown, unless by staff member
	if message.server == server and message.author.id not in config.bannedcommmandusersids:

		if message.content == "F" or message.content == "f":
			if channel == DE or channel == stafffun:
				await client.send_message(channel,"Respect has been paid")

		if message.content.startswith("$bigtext") and channel != hometown:
			text = message.content[9:]
			if text.find("<") == -1 and text.find(">") == -1 and text.find(":") == -1:
				letters = string.ascii_lowercase + string.ascii_uppercase
				numbers = string.digits
				saymsg = ""

				for letter in letters:
					if letter == "a" or letter == "A":
						text = text.replace(letter,"🇦")

					elif letter == "b" or letter == "B":
						text = text.replace(letter,"🇧")

					elif letter == "c" or letter == "C":
						text = text.replace(letter,"🇨")

					elif letter == "d" or letter == "D":
						text = text.replace(letter,"🇩")

					elif letter == "e" or letter == "E":
						text = text.replace(letter,"🇪")

					elif letter == "f" or letter == "F":
						text = text.replace(letter,"🇫")

					elif letter == "g" or letter == "G":
						text = text.replace(letter,"🇬")

					elif letter == "h" or letter == "H":
						text = text.replace(letter,"🇭")

					elif letter == "i" or letter == "I":
						text = text.replace(letter,"🇮")

					elif letter == "j" or letter == "J":
						text = text.replace(letter,"🇯")

					elif letter == "k" or letter == "K":
						text = text.replace(letter,"🇰")

					elif letter == "l" or letter == "L":
						text = text.replace(letter,"🇱")

					elif letter == "m" or letter == "M":
						text = text.replace(letter,"🇲")

					elif letter == "n" or letter == "N":
						text = text.replace(letter,"🇳")

					elif letter == "o" or letter == "O":
						text = text.replace(letter,"🇴")

					elif letter == "p" or letter == "P":
						text = text.replace(letter,"🇵")

					elif letter == "q" or letter == "Q":
						text = text.replace(letter,"🇶")

					elif letter == "r" or letter == "R":
						text = text.replace(letter,"🇷")

					elif letter == "s" or letter == "S":
						text = text.replace(letter,"🇸")

					elif letter == "t" or letter == "T":
						text = text.replace(letter,"🇹")

					elif letter == "u" or letter == "U":
						text = text.replace(letter,"🇺")

					elif letter == "v" or letter == "V":
						text = text.replace(letter,"🇻")

					elif letter == "w" or letter == "W":
						text = text.replace(letter,"🇼")

					elif letter == "x" or letter == "X":
						text = text.replace(letter,"🇽")

					elif letter == "y" or letter == "Y":
						text = text.replace(letter,"🇾")

					elif letter == "z" or letter == "Z":
						text = text.replace(letter,"🇿")
				text = text.replace(" ","🛑")
				for character in text:
					saymsg = "{} {}".format(saymsg,character)
				for number in numbers:
					if number == "1":
						saymsg = saymsg.replace(number,":one:")

					elif number == "2":
						saymsg = saymsg.replace(number,":two:")

					elif number == "3":
						saymsg = saymsg.replace(number,":three:")

					elif number == "4":
						saymsg = saymsg.replace(number,":four:")

					elif number == "5":
						saymsg = saymsg.replace(number,":five:")

					elif number == "6":
						saymsg = saymsg.replace(number,":six:")

					elif number == "7":
						saymsg = saymsg.replace(number,":seven:")

					elif number == "8":
						saymsg = saymsg.replace(number,":eight:")

					elif number == "9":
						saymsg = saymsg.replace(number,":nine:")

					elif number == "0":
						saymsg = saymsg.replace(number,":zero:")
				saymsg = saymsg.replace("?","❓")
				saymsg = saymsg.replace("!","❗")
				saymsg = saymsg.replace(".","⚫")
				saymsg = saymsg.replace("+","➕")
				saymsg = saymsg.replace("-","➖")
				saymsg = saymsg.replace("/","➗")
				saymsg = saymsg.replace("*","✖️")
				saymsg = saymsg.replace("$","💲")
			else:
				saymsg = "Please do not use emojis!"

			await client.send_message(channel,saymsg)

		if message.content.startswith("$spooky") and message.channel == commandschan:
			spookyrole = discord.utils.get(server.roles,id='496317145806798848')
			spookyuser = message.author

			if staff in spookyuser.roles:
				spookyem = discord.Embed(title="I can't make staff spooky :(",type="rich",colour=0x8C0000)
				spookyem.set_footer(text="©2018 x2110311x. All Rights Reserved.",icon_url=client.user.avatar_url)
				spookyem.set_author(name=spookyuser.nick, icon_url=spookyuser.avatar_url)
				await client.send_message(channel,embed=spookyem)

			else:
				if spookyrole not in spookyuser.roles:
					await client.add_roles(spookyuser,spookyrole)

					currentname = spookyuser.nick
					if currentname is None:
						currentname = spookyuser.name
					newname = "👻🎃{}🎃👻".format(currentname)
					await client.change_nickname(spookyuser,newname)

					spookyem = discord.Embed(title="You have been Spookified",type="rich",colour=0x8C0000)
					spookyem.set_footer(text="©2018 x2110311x. All Rights Reserved.",icon_url=client.user.avatar_url)
					spookyem.set_author(name=spookyuser.nick, icon_url=spookyuser.avatar_url)
					await client.send_message(channel,embed=spookyem)
				else:
					spookyem = discord.Embed(title="You were already spookified earlier!",type="rich",colour=0x8C0000)
					spookyem.set_footer(text="©2018 x2110311x. All Rights Reserved.",icon_url=client.user.avatar_url)
					spookyem.set_author(name=spookyuser.nick, icon_url=spookyuser.avatar_url)
					await client.send_message(channel,embed=spookyem)

		if message.content.startswith("$help") and channel != hometown:
			helpembed = discord.Embed(title='Bot Commands', type="rich",colour=0x8C0000)
			helpembed.set_author(name=client.user.name, icon_url=client.user.avatar_url)
			helpembed.set_footer(text="Say $help <command> for more information about a specific command")

			if message.content.find(" ") == -1:

				helpembed.add_field(name="Utility Commands", value="Type `$help utilities` for Utility commands",inline=False)
				helpembed.add_field(name="Fun Commands", value="Type `$help fun` for fun commands",inline=False)
				helpembed.add_field(name="Staff Commands", value="Type `$help staff` for staff commands",inline=False)

			elif message.content.find("utilities") != -1:
				helpembed.add_field(name="$ping", value="Checks the latency of the bot and discord api",inline=False)
				helpembed.add_field(name="$uptime", value="Checks how long the bot has been online",inline=False)
				helpembed.add_field(name="$value", value="Checks the status of a cryptocurrency (currently broken)",inline=False)
				helpembed.add_field(name="$report", value="Report a user that is misbehaving",inline=False)

			elif message.content.find("fun") != -1:
				helpembed.add_field(name="$spooky", value="Gives you spooky name and role for halloween",inline=False)
				helpembed.add_field(name="$rate", value="Find out what I think about something",inline=False)
				helpembed.add_field(name="$8ball", value="Ask a question and see what I think",inline=False)
				helpembed.add_field(name="$mock", value="Mock a statement",inline=False)

			elif message.content.find("staff") != -1:
				helpembed.add_field(name="$say", value="Say something using the bot. [STAFF ONLY]",inline=False)
				helpembed.add_field(name="$restartbot", value="Restart the bot server [STAFF ONLY]",inline=False)
				helpembed.add_field(name="$chanban", value="Bans a user from a channel [STAFF ONLY]",inline=False)
				helpembed.add_field(name="$status", value="Sets the bot status [STAFF ONLY]",inline=False)
				helpembed.add_field(name="$ban", value="Fake bans a user [STAFF ONLY]",inline=False)


			elif message.content.find("$ping") != -1:
				helpembed.add_field(name="$ping", value="Checks the latency of the bot and discord api",inline=False)
				helpembed.add_field(name="Usage", value="`$ping`",inline=False)

			elif message.content.find("$uptime") != -1:
				helpembed.add_field(name="$uptime", value="Checks how long the bot has been online",inline=False)
				helpembed.add_field(name="Usage", value="`$uptime`",inline=False)

			elif message.content.find("$spooky") != -1:
				helpembed.add_field(name="$spooky", value="Gives you spooky name and role for halloween",inline=False)
				helpembed.add_field(name="Usage", value="`$spooky`",inline=False)

			elif message.content.find("$rate") !=-1:
				helpembed.add_field(name="$rate", value="Find out what I think about something",inline=False)
				helpembed.add_field(name="Usage", value="`$rate <something>`",inline=False)

			elif message.content.find("$value") != -1:
				helpembed.add_field(name="$value", value="Checks the status of a cryptocurrency (currently broken)",inline=False)
				helpembed.add_field(name="Usage", value="`$value <coin name or ticker>`",inline=False)

			elif message.content.find("$say") != -1:
				helpembed.add_field(name="$say", value="Say something using the bot. [STAFF ONLY]",inline=False)
				helpembed.add_field(name="Usage", value="`$say <full_channel_name> <message>`",inline=False)

			elif message.content.find("$8ball") != -1:
				helpembed.add_field(name="$8ball", value="Ask a question and see what I think",inline=False)
				helpembed.add_field(name="Usage", value="`$8ball <question>`",inline=False)

			elif message.content.find("$restartbot") != -1:
				helpembed.add_field(name="$restartbot", value="Restart the bot server [STAFF ONLY]",inline=False)
				helpembed.add_field(name="Usage", value="`$restartbot`",inline=False)

			elif message.content.find("$report") != -1:
				helpembed.add_field(name="$report", value="Report a user that is misbehaving. Bot will DM you",inline=False)
				helpembed.add_field(name="Usage", value="`$report`",inline=False)

			elif message.content.find("$chanban") != -1:
				helpembed.add_field(name="$chanban", value="Bans a user from a channel [STAFF ONLY]",inline=False)
				helpembed.add_field(name="Usage", value="`$chanban <user> <channel>` Must actually tag both",inline=False)

			elif message.content.find("$status") != -1:
				helpembed.add_field(name="$status", value="Sets the bot status [STAFF ONLY]",inline=False)
				helpembed.add_field(name="Usage", value="`$status <status>` Say member count for the default status",inline=False)

			elif message.content.find("$mock") != -1:
				helpembed.add_field(name="$mock", value="Mock a statement",inline=False)
				helpembed.add_field(name="Usage", value="`$mock <statement>`",inline=False)

			elif message.content.find("$ban") != -1:
				helpembed.add_field(name="$ban", value="Fake bans a user [STAFF ONLY]",inline=False)
				helpembed.add_field(name="Usage", value="`$ban <user>` **You Must Tag Them**",inline=False)

			else:
				helpembed.add_field(name="Unknown command", value="I'm not sure what commmand that is",inline=False)

			await client.send_message(channel,embed=helpembed)

		#General rate command. Grabs random integer. Make sure it doesn't react with @everyone
		if message.content.startswith("$rate") and message.content.find('@everyone') == -1:
			if channel != hometown or staff in message.author.roles:
				await client.send_message(message.channel, "I would rate {} **{}/10**".format(message.content[6:],random.randint(0,10)))
			else:
				await client.send_message(channel,"Please use this in {}".format(commandschan.mention))

		if message.content.startswith('$ban') and staff in message.author.roles:
			banuser = message.mentions[0]
			await client.change_nickname(banuser, "banned_user")
			await client.send_message(message.channel,"{} has been banned".format(banuser.mention))

		#8ball thing. Checks if user mentioned Sacarver, and if the message had a question mark
		if message.content.startswith("$8ball"):
			if channel != hometown or staff in message.author.roles:
				answer = random.randint(1,8) #Generate random integer and respond accordingly
				if answer == 1:
					await client.send_message(channel, "It is certain")
				elif answer == 2:
					await client.send_message(channel, "Outlook good")
				elif answer == 3:
					await client.send_message(channel, "You may rely on it")
				elif answer == 4:
					await client.send_message(channel, "Hell no")
				elif answer == 5:
					await client.send_message(channel, "Concentrate and ask again")
				elif answer == 6:
					await client.send_message(channel, "My sources say no")
				elif answer == 7:
					await client.send_message(channel, "My answer is no")
				elif answer == 8:
					await client.send_message(channel, "Outlook not good")
			else:
				await client.send_message(channel,"Please use this in {}".format(commandschan.mention))

		#say command. Takes a channel name and message and says it in that channel. Makes sure it doesn't @everyone
		if message.content.startswith("$say") and message.content.find('@everyone') == -1 and staff in message.author.roles:
			msgcontent = message.content[5:] #the actual message minus the command portion
			saywhatindex = msgcontent.find(" ") + 1 #find the space after channel name + 1 for the beginning character of the message
			channelindex = saywhatindex - 1 #subtract one to grab the channel name
			saywhat = msgcontent[saywhatindex:] # the actual string for what to say
			channelname = msgcontent[:channelindex] #the name of the channel
			saychannel = discord.utils.get(server.channels, name=channelname,type=discord.ChannelType.text) #grab the object of the channel to send in. Grabs a NoneType Object if it can't find the channel
			try:
				await client.send_message(saychannel,saywhat) #try to say it. If channel wasn't found, this fails, and skips to except block
			except:
				await client.send_message(channel,"Unable to find channel `{}`".format(channelname))
			await client.delete_message(message) #Delete the message that invokes the command


		if message.content.startswith("$report"):
			cancel = False
			Whodidit = message.author
			await client.delete_message(message)
			#Grab Details
			userem = discord.Embed(title='User ID',description="Please Submit the ID of the user you would like to report. Refer to https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID- if you are unsure on how to do this.",type="rich",colour=0xFF3B00)
			userem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
			startmsg = await client.send_message(Whodidit, embed=userem)
			privchan = startmsg.channel
			reportuserid = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
			if reportuserid.content.lower() == "cancel":
				cancel = True
			else:
				try:
					reportuser = server.get_member(reportuserid.content).mention
				except:
					try:
						reportuser = reportuserid.content
					except:
						reportuser = "Invalid or no response received"

			if cancel == False:
				reasonem = discord.Embed(title='Reason for Report',description="Why are you reporting this user?",type="rich",colour=0xFF3B00)
				reasonem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
				await client.send_message(Whodidit, embed=reasonem)
				reportreason = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
				if reportreason.content.lower() == "cancel":
					cancel = True
				else:
					try:
						reason = reportreason.content
					except:
						reason = "Invalid or no response received"

			if cancel == False:
				channelem = discord.Embed(title="What channel did it happen in?", description="Please send the name of the channel.",type="rich",colour=0xFF3B00)
				channelem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
				await client.send_message(Whodidit,embed=channelem)
				reportchanid = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
				if reportchanid.content.lower() == "cancel":
					cancel = True
				else:
					try:
						channelhappened = reportchanid.content
					except:
						channelhappened = "Invalid or no response received"
						invalidresponse += 1

			if cancel == False:
				commentem = discord.Embed(title='Comments',description="Please include any other details you would like to share with staff. Otherwise, say No comment.",type="rich",colour=0xFF3B00)
				commentem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
				await client.send_message(Whodidit,embed=commentem)
				comments = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
				if comments.content.lower() == "cancel":
					cancel = True
				else:
					try:
						comment = comments.content
					except:
						comment = "Invalid or no response received"

			if cancel == False:
				reportstaffchan = client.get_channel("470406971057635328")
				now = datetime.datetime.now()
				timestr = now.strftime("%a %B %d %Y %H:%M")
				correct = 0
				report = discord.Embed(title='User Submitted Report'.format(Whodidit.nick), type="rich",colour=0x8C0000)
				report.set_footer(text="©2018 x2110311x. All Rights Reserved. Submitted at {}".format(timestr),icon_url=client.user.avatar_url)
				report.set_author(name=Whodidit.nick, icon_url=Whodidit.avatar_url)
				def addfields(user,reas,hapchan,comments):
					report.add_field(name="Reported User", value=user,inline=False)
					report.add_field(name="Reason for Report", value=reas,inline=False)
					report.add_field(name="Channel", value=hapchan,inline=False)
					report.add_field(name="Comments", value=comments,inline=False)
				addfields(reportuser,reason,channelhappened,comment)
				while correct == 0:
					await client.send_message(Whodidit,embed=report)
					await client.send_message(Whodidit, "Does this look correct? Say `yes` if it's right, or say `no`")
					correctornah = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
					if correctornah.content.lower() == "yes":
						correct = 1
					elif correctornah.content.lower()== "no":
						await client.send_message(Whodidit, "What needs fixed? Please say `user`, `reason`,`channel`, or `comment`")
						fixed = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
						if fixed.content.lower()== "user":
							userem = discord.Embed(title='User ID',description="Please Submit the ID of the user you would like to report. Refer to https://support.discordapp.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID- if you are unsure on how to do this.",type="rich",colour=0xFF3B00)
							userem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
							await client.send_message(Whodidit, embed=userem)
							reportuserid = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
							try:
								reportuser = server.get_member(reportuserid.content).mention
							except:
								reportuser = "Invalid or no response received"
							report.clear_fields()
							addfields(reportuser,reason,channelhappened,comment)
						elif fixed.content.lower()== "reason":
							reasonem = discord.Embed(title='Reason for Report',description="Why are you reporting this user?",type="rich",colour=0xFF3B00)
							reasonem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
							await client.send_message(Whodidit, embed=reasonem)
							reportreason = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
							try:
								reason = reportreason.content
							except:
								reason = "Invalid or no response received"
							report.clear_fields()
							addfields(reportuser,reason,channelhappened,comment)
						elif fixed.content.lower()== "channel":
							channelem = discord.Embed(title="What channel did it happen in?", description="Please send the name of the channel.",type="rich",colour=0xFF3B00)
							channelem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
							await client.send_message(Whodidit,embed=channelem)
							reportchanid = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
							try:
								channelhappened = reportchanid.content
							except:
								channelhappened = "Invalid or no response received"
							report.clear_fields()
							addfields(reportuser,reason,channelhappened,comment)
						elif fixed.content.lower()== "comment":
							commentem = discord.Embed(title='Comments',description="Please include any other details you would like to share with staff. Otherwise, say No comment.",type="rich",colour=0xFF3B00)
							commentem.set_footer(text="Cancel the report anytime by saying cancel",icon_url=client.user.avatar_url)
							await client.send_message(Whodidit,embed=commentem)
							comments = await client.wait_for_message(author=Whodidit,channel=privchan,timeout=float(120))
							try:
								comment = comments.content
							except:
								comment = "Invalid or no response received"
							report.clear_fields()
							addfields(reportuser,reason,channelhappened,comment)
						elif fixed.content.lower() == "cancel":
							cancel = True
							correct = 1
					elif correctornah.content.lower() == "cancel":
						correct = 1
						cancel = True
			if cancel == False:
				thankem = discord.Embed(title='Thank you for your submission', type="rich",colour=0xFF3B00)
				thankem.set_footer(text='Sacarver', icon_url=client.user.avatar_url)
				await client.send_message(Whodidit,embed=thankem)
				await client.send_message(reportstaffchan,embed=report)
			elif cancel == True:
				await client.send_message(Whodidit,"Okay. Report canceled")

		if message.content.startswith("$chanban") and staff in message.author.roles:
			chanbanmem = message.mentions[0]
			chantoban = message.channel_mentions[0]
			chanbanmemid = chanbanmem.id
			chantobanid = chantoban.id
			overwrite = discord.PermissionOverwrite()
			overwrite.read_messages = False
			overwrite.send_messages = False
			await client.edit_channel_permissions(chantoban,chanbanmem,overwrite)
			await client.send_message(message.channel,"Banning {} from {}".format(chanbanmem.name, chantoban.name))
			try:
				with open('chanban.csv','w') as File:
					headers = ['memid','chanid']
					csvwriter = csv.DictWriter(File, fieldnames=headers)
					data = {'memid':chanbanmemid,'chanid':chantobanid}
					chanbandict.append(data)
					csvwriter.writeheader()
					csvwriter.writerows(chanbandict)
			except:
				client.send_message(testchannel,"Could not write to CSV")

		if message.content.startswith("$mock") and message.channel != hometown:
			mockmsg = message.content[5:]
			mocklen = len(mockmsg)
			returnmsg = ""
			for x in range(1,mocklen):
				if x%2 == 0:
					returnmsg = "{}{}".format(returnmsg,mockmsg[x:x+1].upper())
				elif x%2 == 1:
					returnmsg = "{}{}".format(returnmsg,mockmsg[x:x+1].lower())
			await client.send_file(channel,"/bots/images/mocking-spongebob.jpg")
			await client.send_message(channel,returnmsg)

		#Set the status of bot
		if message.content.startswith('$status') and staff in message.author.roles:
			statusmsg = message.content[8:]
			if statusmsg == "member count":
				await client.change_presence(game=discord.Game(name='with {} members'.format(message.author.server.member_count)))
				memberstatus = True
			else:
				await client.change_presence(game=discord.Game(name=statusmsg))
				memberstatus = False
		#ping command
		if message.content.startswith('$ping'):
			if channel != hometown or staff in message.author.roles:
				msg1 = message.timestamp #grab the timestamp of the message invoking the command
				msg2 = await client.send_message(channel,"Bot is Up!") #reply
				msg2time = msg2.timestamp #find the timestamp of the reply
				difftime = msg2time - msg1 #find the difference
				datetime.timedelta(0, 4, 316543)
				diffms = int(difftime.microseconds/1000) #convert to milliseconds
				await client.edit_message(msg2 ,"Pong! `{}ms`".format(diffms)) #edit message
			else:
				await client.send_message(channel,"Please use this in {}".format(commandschan.mention))

		if message.content.startswith("$restartbot") and staff in message.author.roles:
			await client.send_message(message.channel,"***BOT IS RESTARTING***")
			os.system('/bots/sacarver/bashscripts/restart.sh')

		if message.content.startswith("$updatebot") and staff in message.author.roles:
			await client.send_message(message.channel,"***BOT IS UPDATING***"
			os.system('/bots/sacarver/bashscripts/update.sh')
		    restart()

		#Uptime of bot, and time till restart
		if message.content.startswith('$uptime'):
			if channel != hometown or staff in message.author.roles:
				nowtime = time()
				tillrestart = utilities.time_until_restart(starttime)
				uptime = utilities.seconds_to_units(int(nowtime - starttime))
				await client.send_message(channel,"Sacarver has been online for `{}`.\n{}".format(uptime,tillrestart))
			else:
				await client.send_message(channel,"Please use this in {}".format(commandschan.mention))
		if message.content.startswith("$woot"):
			await client.send_message(channel,"woot!")

		if message.content.startswith("$image") and staff in message.author.roles:
			args = message.content[7:]
			response = google_images_download.googleimagesdownload()
			absolute_image_paths = response.download({"keywords":"{}".format(args),"limit":1,"output_directory":"images"})
			await client.send_file(channel,absolute_image_paths[args][0])


#update status if it's member count and a player leaves
@client.event
async def on_member_remove(member):
	server = client.get_server('config.serverid')
	if memberstatus == True:
		await client.change_presence(game=discord.Game(name='with {} members'.format(server.member_count)))

#commands to run as soon as bot logs in
@client.event
async def on_ready():
	#grab channel and server objects
	server = client.get_server(config.serverid)
	testchannel = client.get_channel(config.channels['testchannel'])

	#Acknowledge that it's online
	print('Logged in')
	await client.send_message(testchannel,"Bot is back online. Bot auto restarts every 12 hours.")
	restartT.start()

	#Set the status
	await client.change_presence(game=discord.Game(name='with {} members'.format(server.member_count)))
	memberstatus = True

client.run(config.bottoken) #run the bot
