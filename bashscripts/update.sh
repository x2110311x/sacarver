#!/bin/bash
cd /bots/sacarver
git fetch --all
git reset --hard origin/master
git pull origin master
sudo chown root:root /bots/sacarver/bashscripts/*
sudo chmod 777 /bots/sacarver/bashscripts/*
