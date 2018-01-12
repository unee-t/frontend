#!/bin/bash
for STAGE in dev prod
do
	echo Mongo dumping stage $STAGE
	source ../aws-env.$STAGE
	mongodump --host $(echo $MONGO_CONNECT | cut -d "/" -f1) --ssl --username root --password $MONGO_PASSWORD --authenticationDatabase admin --db test -o $(date "+$STAGE-%Y%m%d")
done
