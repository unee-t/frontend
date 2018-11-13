#!/bin/bash
for STAGE in dev
do
	echo Mongo dumping stage $STAGE
	source ../aws-env.$STAGE
	mongodump --host $(echo $MONGO_CONNECT | cut -d "/" -f1) --ssl --username root --password $MONGO_PASSWORD --authenticationDatabase admin --db meteor -o $(date "+$STAGE-%Y%m%d")
done
