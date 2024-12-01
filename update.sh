#!/bin/bash

source .env

git pull

cd DB
sequelize-auto -h 127.0.0.1 -d sacarver -u root -x $SQLRoot  -o ./models/ > /dev/null

cd ../

docker compose build

docker compose down
docker compose up -d

docker image prune -f > /dev/null