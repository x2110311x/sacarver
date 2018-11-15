import pymysql.cursors
import datetime
import calendar
from time import sleep
from include import config

try:
    mysqldb = pymysql.connect(host="localhost",
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor) #mongoclient object
    print("Connected to database")
except Exception as e:
    print("Could not connect")
    print(e)
    quit()

dates = []
daycount = {
    "monday":0,
    "tuesday":0,
    "wednesday":0,
    "thursday":0,
    "friday":0,
    "saturday":0,
    "sunday":0
}
monday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
tuesday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
wednesday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
thursday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
friday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
saturday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
sunday = {
    0:0,
    1:0,
    2:0,
    3:0,
    4:0,
    5:0,
    6:0,
    7:0,
    8:0,
    9:0,
    10:0,
    11:0,
    12:0,
    13:0,
    14:0,
    15:0,
    16:0,
    17:0,
    18:0,
    19:0,
    20:0,
    21:0,
    22:0,
    23:0
}
weekdayboyos = [monday,tuesday,wednesday,thursday,friday,saturday,sunday]


print("I'm about to execute the query")
try:
    with mysqldb.cursor() as cursor:
        sql = "SELECT time FROM messages WHERE time < 1542153600 "
        cursor.execute(sql)
        print("Query Executed...Grabbing Results")
        result = cursor.fetchall()
        print("Results Grabbed...Processing...")

        for row in result:
            bigdateboy = datetime.datetime.fromtimestamp(row['time'])
            dayofweek = bigdateboy.weekday()
            hourboy = bigdateboy.hour
            dayofweekname = calendar.day_name[dayofweek].lower()

            if bigdateboy.date not in dates:
                dates.append(bigdateboy.date)
                daycount[dayofweekname] += 1 

            weekdayboyos[dayofweek][hourboy] += 1

        print("Done calculating...Inserting into database...")
        sqlinsert = "INSERT INTO houraverages (dayhour,averagemsg,dayscounted) VALUES(%s,%s,%s,%s)"
        for daything in weekdayboyos:
            weekdayname = calendar.day_name[weekdayboyos.index(daything)].lower()
            for hourdad in daything:
                thisdaycount = daycount[weekdayname]
                average = int(daything[hourdad] / thisdaycount)
                dayhourid = weekdayname + str(hourdad)
                cursor.execute(sqlinsert, (dayhourid,average,thisdaycount))
                mysqldb.commit()
    print("Done!")
except Exception as e:
    print(e)
    print("Fail!")
