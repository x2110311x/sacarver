# ****************************************************** #
# Name: Checks.py
# Author: Alex Sweeney (x2110311x)
# Desc: This file defines all the command checks
# ****************************************************** #
from discord.ext import commands
from include import config


# Define exceptions #
class HometownCommands(commands.CheckFailure):
    pass


class PingsEveryone(commands.CheckFailure):
    pass

# Check definitions #


def notHometown():
    async def predicate(ctx):
        if ctx.server.get_role(config.roles["staff"]) in ctx.user.roles:
            return True
        elif ctx.channel.id != config.channel["hometown"]:
            return True
        else:
            raise HometownCommands("Commands are not allowed in hometown")


def notPingEveryone():
    async def predicate(ctx):
        if ctx.message.contents.find("@everyone") != -1:
            raise PingsEveryone("I'm not going to ping everyone bud")
        elif ctx.message.contents.find("@here") != -1:
            raise PingsEveryone("I'm not going to ping here bud")
        else:
            return True
