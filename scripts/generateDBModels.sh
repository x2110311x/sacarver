#!/bin/bash

source .env

git pull

cd ./structures/DB
sequelize-auto -h $MYSQL_HOST -p $MYSQL_PORT -d $MYSQL_DATABASE -u $MYSQL_USER -x $MYSQL_PASSWORD  -o ./models/ > /dev/null

# Fix Sequelize alias collision on NoteVersions (attribute 'Note' vs association 'Note')
if [ -f ./models/init-models.js ]; then
  sed -i 's/{ as: "Note", foreignKey: "NoteID"}/{ as: "parentNote", foreignKey: "NoteID", onDelete: "CASCADE" }/g' ./models/init-models.js
fi
