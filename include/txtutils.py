import string
import random

def mock(mockmsg):
    mocklen = len(mockmsg)
    returnmsg = ""
    for x in range(1,mocklen):
        if x%2 == 0:
            returnmsg = "{}{}".format(returnmsg,mockmsg[x:x+1].upper())
        elif x%2 == 1:
            returnmsg = "{}{}".format(returnmsg,mockmsg[x:x+1].lower())
    return returnmsg

def bigtext(text):
    lowerletters = string.ascii_lowercase
    upperletters = string.ascii_uppercase
    numbers = string.digits
    lettersym = ["🇦","🇧","🇨","🇩","🇪","🇫","🇬","🇭","🇮","🇯","🇰","🇱","🇲",
                "🇳","🇴","🇵","🇶","🇷","🇸","🇹","🇺","🇻","🇼","🇽","🇾","🇿"]
    numemoji = [":zero:",":one:",":two:",":three:",":four:",":five:"
            ,":six:",":seven:",":eight:",":nine:"]

    for x in range(0,26):
        text = text.replace(lowerletters[x],lettersym[x])
        text = text.replace(upperletters[x],lettersym[x])

    text = text.replace(" ","🛑")
    saymsg = ""
    for character in text:
        saymsg = "{} {}".format(saymsg,character)
    for x in range(0,10):
        saymsg = saymsg.replace(numbers[x],numemoji[x])

    return saymsg


def magic8ball():
    quotes = [
        "It is certain",
        "Outlook good",
        "You may rely on it",
        "Hell no",
        "Concentrate and ask again",
        "My sources say no",
        "My answer is no",
        "Outlook not good"
    ]
    return quotes[random.randint(0,len(quotes))]
