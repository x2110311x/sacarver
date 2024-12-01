#!/bin/bash

source .env

git pull

cd DB
sequelize-auto -h $MYSQL_HOST -p $MYSQL_PORT -d sacarver -u $MYSQL_USER -x $MYSQL_PASSWORD  -o ./models/ > /dev/null

cd ../

docker compose build

docker compose down
docker compose up -d

docker image prune -f > /dev/null