#!/bin/bash
cd /bots/sacarver
git fetch --all
git reset --hard origin/master
git pull origin master
chown root:root /bots/sacarver/bashscripts/*
chmod 777 /bots/sacarver/bashscripts/*
