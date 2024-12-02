#!/bin/bash

source .env

git pull

source ./scripts/generateDBModels.sh

docker compose build

docker compose down
docker compose up -d

docker image prune -f > /dev/null