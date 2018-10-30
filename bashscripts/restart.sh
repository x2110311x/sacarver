#!/bin/bash
pkill -9 -f sacarver.py
pkill -9 -f restartupdate.py
sudo python3 /bots/sacarver/restartupdate.py &
sudo python3 /bots/sacarver/sacarver.py
