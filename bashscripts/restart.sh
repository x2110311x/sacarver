#!/bin/bash
pkill -9 -f sacarver.py
./bots/sacarver/bashscripts/restartupdater.sh &
sudo python3 /bots/sacarver/sacarver.py
