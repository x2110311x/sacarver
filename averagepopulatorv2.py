import multiprocessing
import pymysql.cursors
import datetime
import calendar
from time import time,sleep
from include import config, utilities
from progress.bar import Bar
import sys
import csv


def gettotal(total,timetoquery):
    print("Connecting to DB")
    thesqlboi = pymysql.connect(host="149.28.49.5",
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)
    print("Connected. Grabbing Total")
    with thesqlboi.cursor() as cursor:
        sql = "select count(*) from messages where time < %s"
        cursor.execute(sql,(timetoquery))
        result = cursor.fetchone()
        total.value = int(result['count(*)'])
    print("Total Grabbed. Beginning processing")
    thesqlboi.close()

def calcavgs(arrWeekDay,strWeekday,Progresscounter,intTimeforquery,daycount,querydone):
    dates = []
    daycount = 0
    mysqldb = pymysql.connect(host="149.28.49.5",
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)
    with mysqldb.cursor() as cursor:
        sql = "SELECT * FROM messages WHERE time < %s AND DAYNAME(FROM_UNIXTIME(TIME)) = %s"
        cursor.execute(sql,(intTimeforquery,strWeekday))
        result = cursor.fetchall()
        querydone.value += 1
        for row in result:
            bigdateboy = datetime.datetime.fromtimestamp(row['time'])
            hourboy = bigdateboy.hour
            if bigdateboy.date not in dates:
                dates.append(bigdateboy.date)
                daycount += 1
            arrWeekDay[hourboy] += 1
            Progresscounter.value += 1
    mysqldb.close()

def progressbar(progresscounter,total,starttime,queriesdone):
    modulothing = int(total.value/1000)
    while True:
        curtime = int(time())
        elapsed = curtime - starttime
        elapsedstr = utilities.seconds_to_units(elapsed)
        if progresscounter.value > 0:
            eta = utilities.seconds_to_units(int((elapsed/progresscounter.value) * (total.value-progresscounter.value)))
        else:
            eta= "?"
        status = "{} Completed. Elapsed: {}. ETA: {}".format(progresscounter.value,elapsedstr,eta)
        sys.stdout.write("\b" * (len(status)+1))
        sys.stdout.flush()
        sys.stdout.write(status)
        sys.stdout.flush()
        sleep(1)

if __name__ == "__main__":

    timetoquery = datetime.datetime.now() - datetime.timedelta(days=1)
    timetoquery = int(datetime.datetime.combine(timetoquery, datetime.datetime.min.time()).timestamp())

    total = multiprocessing.Value('i', 0)

    monday = multiprocessing.Array('i', 24)
    tuesday = multiprocessing.Array('i', 24)
    wednesday = multiprocessing.Array('i', 24)
    thursday = multiprocessing.Array('i', 24)
    friday = multiprocessing.Array('i', 24)
    saturday = multiprocessing.Array('i', 24)
    sunday = multiprocessing.Array('i', 24)
    daycount = multiprocessing.Array('i', 7)
    queriesdone = multiprocessing.Value('i', 0)

    weekdayboyos = [monday,tuesday,wednesday,thursday,friday,saturday,sunday]

    progresscounter = multiprocessing.Value('i', 0)

    gettotalproc = multiprocessing.Process(target=gettotal, args = (total,timetoquery))
    gettotalproc.start()
    gettotalproc.join()

    starttime = int(time())

    mondayproc = multiprocessing.Process(target=calcavgs, args=(monday,'Monday',progresscounter,timetoquery,daycount[0],queriesdone))
    tuesdayproc = multiprocessing.Process(target=calcavgs, args=(tuesday,'Tuesday',progresscounter,timetoquery,daycount[1],queriesdone))
    wednesdayproc = multiprocessing.Process(target=calcavgs, args=(wednesday,'Wednesday',progresscounter,timetoquery,daycount[2],queriesdone))
    thursdayproc = multiprocessing.Process(target=calcavgs, args=(thursday,'Thursday',progresscounter,timetoquery,daycount[3],queriesdone))
    fridayproc = multiprocessing.Process(target=calcavgs, args=(friday,'Friday',progresscounter,timetoquery,daycount[4],queriesdone))
    saturdayproc = multiprocessing.Process(target=calcavgs, args=(saturday,'Saturday',progresscounter,timetoquery,daycount[5],queriesdone))
    sundayproc = multiprocessing.Process(target=calcavgs, args=(sunday,'Sunday',progresscounter,timetoquery,daycount[6],queriesdone))
    progresspoc = multiprocessing.Process(target=progressbar, args=(progresscounter,total,starttime,queriesdone))

    mondayproc.start()
    tuesdayproc.start()
    wednesdayproc.start()
    thursdayproc.start()
    fridayproc.start()
    saturdayproc.start()
    sundayproc.start()
    progresspoc.start()

    mondayproc.join()
    tuesdayproc.join()
    wednesdayproc.join()
    thursdayproc.join()
    fridayproc.join()
    saturdayproc.join()
    sundayproc.join()
    progresspoc.terminate()

    print('\n')
    print("Done Processing. Inserting into DB")

    thesqlboi = pymysql.connect(host="149.28.49.5",
                             user=config.mysqlcreds["username"],
                             password=config.mysqlcreds["password"],
                             db=config.mysqlcreds["database"],
                             charset='utf8mb4',
                             cursorclass=pymysql.cursors.DictCursor)
    with thesqlboi.cursor() as cursor:
        with open('results.csv', mode='w') as resultscsv:
            fieldnames = ['dayhour', 'averagemsg', 'dayscounted']
            resultswriter = csv.DictWriter(resultscsv, fieldnames=fieldnames)
            resultswriter.writeheader()
            sqlinsert = "INSERT INTO houraverages (dayhour,averagemsg,dayscounted) VALUES(%s,%s,%s,%s)"

            for daything in weekdayboyos:
                weekdayname = calendar.day_name[weekdayboyos.index(daything)].lower()
                for hourdad in daything:

                    thisdaycount = daycount[weekdayboyos.index(daything)]
                    average = int(daything[hourdad] / thisdaycount)
                    dayhourid = weekdayname + str(hourdad)
                    csventry = {
                        "dayhour": dayhourid,
                        "averagemsg":average,
                        "dayscounted":thisdaycount
                        }
                    resultswriter.writerow(csventry)
                    cursor.execute(sqlinsert, (dayhourid,average,thisdaycount))
                    thesqlboi.commit()
    print("Done!")
