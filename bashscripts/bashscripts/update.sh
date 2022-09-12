#! /bin/bash
cd /bots/sacarver/bot
git fetch --all
git reset --hard origin/master
git pull origin master
systemctl restart sacarver
