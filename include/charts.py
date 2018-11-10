import matplotlib.pyplot as plt
from pymongo import MongoClient
from include import config
from datetime import date
from datetime import datetime
from datetime import timedelta


mclient = MongoClient(config.mongouri)
db = mclient.messagetrends

messagedb = db.messages
channeldb = db.channel
joindb = db.joins
leavedb = db.leave
userdb = db.users
editdb = db.edited
deletedb = db.deleted
nicknamedb = db.nicknames

def messyesterday(imgname):
    times = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"]
    messagenum = []
    yesterday = datetime.now() - timedelta(days=1)
    yesterday = int(datetime.combine(yesterday, datetime.min.time()).timestamp())
    for x in range(0,24):
        starttime = yesterday + (3600 * (x - 1))
        endtime = yesterday + (3600 * x)
        count = messagedb.count_documents({ "time" : { "$gt" : starttime, "$lt" : endtime } })
        messagenum.append(count)

    plt.plot(times, messagenum, color='black')
    plt.xticks(rotation=45)
    plt.xlabel('Hour in UTC')
    plt.ylabel('Number of messages')
    plt.title('Messages per hour yesterday')
    plt.savefig(imgname)

mclient.close()
