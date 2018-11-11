import matplotlib.pyplot as plt
import pymysql.cursors
from include import config
from datetime import date
from datetime import datetime
from datetime import timedelta

try:
    mysqldb = pymysql.connect(host=config.mysqlcreds["host"],
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor) #mongoclient object
except:
    print("Could not connect")
    quit()

def messyesterday(imgname):
    times = ["12am","1am","2am","3am","4am","5am","6am","7am","8am","9am","10am","11am","12pm","1pm","2pm","3pm","4pm","5pm","6pm","7pm","8pm","9pm","10pm","11pm"]
    messagenum = []
    yesterday = datetime.now() - timedelta(days=1)
    yesterday = int(datetime.combine(yesterday, datetime.min.time()).timestamp())
    for x in range(0,24):
        starttime = yesterday + (3600 * (x - 1))
        endtime = yesterday + (3600 * x)
        with mysqldb.cursor() as cursor:
            sql = "SELECT count(*) FROM messages WHERE time >= %s AND time <= %s"
            count = cursor.execute(sql,(starttime,endtime))
            messagenum.append(count)

    plt.plot(times, messagenum, color='black')
    plt.xticks(rotation=45)
    plt.xlabel('Hour in UTC')
    plt.ylabel('Number of messages')
    plt.title('Messages per hour yesterday')
    plt.savefig(imgname)

mysqldb.close()
