#!/bin/bash

password=$(aws --profile uneet-demo ssm get-parameters --names MONGO_PASSWORD --with-decryption --query Parameters[0].Value --output text)
host=$(aws --profile uneet-demo ssm get-parameters --names MONGO_CONNECT --query Parameters[0].Value --output text)
mongorestore --host $(echo $host |  sed 's,/.*,,' ) --db meteor --ssl --username root --password $password  --authenticationDatabase admin
