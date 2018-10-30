#!/bin/bash
cd /bots/sacarver
git reset --hard origin/master
git pull git@github.com:x2110311x/sacarver.git
chown root:root /bots/sacarver/bashscripts/*
chmod 777 /bots/sacarver/bashscripts/*
