from time import time
import datetime
from bs4 import BeautifulSoup
import urllib


def seconds_to_units(seconds):  # convert seconds int to h/m/s string
    if seconds < 60:
        return "{} seconds".format(seconds)
    else:
        minutes = int(seconds / 60)
        secremain = int(seconds - (minutes * 60))
        if minutes >= 60:
            hours = int(minutes / 60)
            minremain = int(minutes - (hours * 60))
            if hours >= 24:
                days = int(hours / 24)
                hoursremain = int(hours - (days * 24))
                if days >= 7:
                    weeks = int(days / 7)
                    daysremain = int(days - (weeks * 7))
                    return f"{weeks} weeks, {daysremain} days, {hoursremain} hours, {minremain} minutes, and {secremain} seconds"
                else:
                    return f"{days} days, {hoursremain} hours, {minremain} minutes, and {secremain} seconds"
            else:
                return f"{hours} hours, {minremain} minutes, and {secremain} seconds"
        else:
            return "{} minutes, and {} seconds".format(minutes, secremain)


# Function for calculating time until restart #
def time_until_restart(starttime):
    now = time()  # grab the current datetime object
    restarttime = starttime + 43200
    left = seconds_to_units(int(restarttime - now))
    return "`{}` until restart.".format(left)


def msdiff(t1, t2):
    difftime = t2 - t1  # find the difference
    datetime.timedelta(0, 4, 316543)
    diffms = int(difftime.microseconds / 1000)  # convert to milliseconds
    return diffms


def ytsearch(video):
    result = ''
    query = urllib.parse.quote(video)
    url = "http://www.youtube.com/results?search_query=" + query
    response = urllib.request.urlopen(url)
    html = response.read()
    soup = BeautifulSoup(html, "html.parser")
    vidnum = 0
    for vid in soup.findAll(attrs={'class': 'yt-uix-tile-link'}):
        if vid['href'].find("https://googleads.g.doubleclick.net/") == -1 and vid['href'].find("www.googleadservices.com") == -1:
            if vidnum == 1:
                pass
            else:
                result = 'http://www.youtube.com' + vid['href']
                vidnum = 1
    return result
