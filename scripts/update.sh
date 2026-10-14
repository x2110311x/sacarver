#!/bin/bash

source .env

git pull

export GIT_COMMIT=$(git rev-parse --short HEAD)

if grep -q "^GIT_COMMIT=" .env 2>/dev/null; then
  sed -i "s/^GIT_COMMIT=.*/GIT_COMMIT=$GIT_COMMIT/" .env
else
  echo "GIT_COMMIT=$GIT_COMMIT" >> .env
fi

source ./scripts/generateDBModels.sh

docker compose build

docker compose down
docker compose up -d

docker image prune -f > /dev/null