#!/bin/bash

source .env

git pull

cd ./structures/DB
sequelize-auto -h $MYSQL_HOST -p $MYSQL_PORT -d $MYSQL_DATABASE -u $MYSQL_USER -x $MYSQL_PASSWORD  -o ./models/ > /dev/null

cd ../../

docker compose build

docker compose down
docker compose up -d

docker image prune -f > /dev/null