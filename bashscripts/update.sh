#!/bin/bash
cd /bots/sacarver
git reset --hard origin/master 
git pull git@github.com:x2110311x/sacarver.git
chmod +x /bots/sacarver/bashscripts/*
