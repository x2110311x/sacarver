#!/bin/bash
cd /bots/sacarver
git fetch git@github.com:x2110311x/sacarver.git
chown root:root /bots/sacarver/bashscripts/*
chmod 777 /bots/sacarver/bashscripts/*
