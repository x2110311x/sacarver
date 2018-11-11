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
    for x in range(0,24):
        messagenum.append(0)
    starttime = datetime.now() - timedelta(days=1)
    endtime = int(datetime.combine(starttime, datetime.max.time()).timestamp())
    starttime = int(datetime.combine(starttime, datetime.min.time()).timestamp())
    with mysqldb.cursor() as cursor:
        sql = "SELECT * FROM messages WHERE time >= %s AND time <= %s"
        cursor.execute(sql,(starttime,endtime))
        result = cursor.fetchall()
        for row in result:
            rowtime = datetime.fromtimestamp(int(row['time'])).hour
            messagenum[rowtime] += 1



    plt.plot(times, messagenum, color='black')
    plt.xticks(rotation=45)
    plt.xlabel('Hour in UTC')
    plt.ylabel('Number of messages')
    plt.title('Messages per hour yesterday')
    plt.savefig(imgname)
