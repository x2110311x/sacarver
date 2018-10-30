from time import time

def seconds_to_units(seconds): #convert seconds int to h/m/s string
	if seconds < 60:
		return "{} seconds".format(seconds)
	else:
		minutes = int(seconds/60)
		secremain = int(seconds - (minutes * 60))
		if minutes >= 60:
			hours = int(minutes/60)
			minremain = int(minutes - (hours * 60))
			if hours >= 24:
				days = int(hours/24)
				hoursremain = int(hours - (days * 24))
				return "{} days, {} hours, {} minutes, and {} seconds".format(days,hoursremain,minremain,secremain)
			else:
				return "{} hours, {} minutes, and {} seconds".format(hours,minremain,secremain)
		else:
			return "{} minutes, and {} seconds".format(minutes,secremain)

def time_until_restart(starttime): #Function for calculating time until restart
	now = time() #grab the current datetime object
	restarttime = starttime + 43200
	left = seconds_to_units(int(restarttime-now))
	return  "`{}` until restart.".format(left)
