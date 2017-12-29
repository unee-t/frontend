#!/bin/bash

STAGE=dev

# Usage info
show_help() {
cat << EOF
Usage: ${0##*/} [-p] COMMIT

By default, deploy to dev environment on AWS account 8126-4485-3088

	-p          PRODUCTION (1924-5899-3663)

EOF
}

while getopts "p" opt
do
	case $opt in
		p)
			echo "PRODUCTION" >&2
			STAGE=prod
			;;
		*)
			show_help >&2
			exit 1
			;;
	esac
done
AWS_PROFILE=lmb-$STAGE
shift "$((OPTIND-1))"   # Discard the options and sentinel --

if ! test "$1"
then
	show_help >&2
	exit 1
fi
echo COMMIT: $1

if ! aws configure --profile $AWS_PROFILE list
then
	echo Profile $AWS_PROFILE does not exist >&2
	echo Attempting to setup one from the environment >&2
	aws configure set profile.lmb-dev.aws_access_key_id $AWS_ACCESS_KEY_ID
	aws configure set profile.lmb-dev.aws_secret_access_key $AWS_SECRET_ACCESS_KEY
	aws configure set profile.lmb-dev.region ap-southeast-1
fi

if ! hash ecs-cli
then
	echo Please install https://github.com/aws/amazon-ecs-cli and ensure it is in your \$PATH
	echo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-linux-amd64-latest && chmod +x /usr/local/bin/ecs-cli
else
	ecs-cli -version
fi

ecs-cli configure --cluster master --region ap-southeast-1 --compose-service-name-prefix ecscompose-service-
test -f aws-env.$STAGE && source aws-env.$STAGE

COMMIT=$1 envsubst < AWS-docker-compose-meteor.yml > docker-compose-meteor.yml

ecs-cli compose --aws-profile $AWS_PROFILE -p meteor -f docker-compose-meteor.yml service up --timeout 7

ecs-cli compose --aws-profile $AWS_PROFILE -p meteor -f docker-compose-meteor.yml service ps
