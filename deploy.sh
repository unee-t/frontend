#!/bin/bash
set -e

echo "START $0 $(date)"
STAGE=dev

# Usage info
show_help() {
cat << EOF
Usage: ${0##*/} [-p]

By default, deploy to dev environment on AWS account

	-p          PRODUCTION
	-d          DEMO

EOF
}

while getopts "pd" opt
do
	case $opt in
		#Add option d for development
		# For DEV, we are using AWS Codebuild for the deployment (NOT TRAVIS)
    	# This will need to be evaluated going forward but for now we continue like this...
    	# We comment out the DEV option
		# d)
		# 	echo "DEVELOPMENT" >&2
		# 	STAGE=dev
		# 	;;
		p)
			echo "PRODUCTION" >&2
			STAGE=prod
			;;
		d)
			echo "DEMO" >&2
			STAGE=demo
			;;
		*)
			show_help >&2
			exit 1
			;;
	esac
done

shift "$((OPTIND-1))"   # Discard the options and sentinel --

export COMMIT=$(git rev-parse --short HEAD)

if ! aws configure --profile $TRAVIS_PROFILE list
then
	echo Profile $TRAVIS_PROFILE does not exist >&2

	if ! test "$TRAVIS_AWS_ACCESS_KEY_ID"
	then
		echo Missing $TRAVIS_AWS_ACCESS_KEY_ID >&2
		exit 1
	fi

	echo Attempting to setup one from the environment >&2
	aws configure set profile.${TRAVIS_PROFILE}.aws_access_key_id $TRAVIS_AWS_ACCESS_KEY_ID
	aws configure set profile.${TRAVIS_PROFILE}.aws_secret_access_key $TRAVIS_AWS_SECRET_ACCESS_KEY
	aws configure set profile.${TRAVIS_PROFILE}.region $TRAVIS_AWS_DEFAULT_REGION

	if ! aws configure --profile $TRAVIS_PROFILE list
	then
		echo Profile $TRAVIS_PROFILE does not exist >&2
		exit 1
	fi

fi

if ! hash ecs-cli
then
	echo Please install https://github.com/aws/amazon-ecs-cli and ensure it is in your \$PATH
	echo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-linux-amd64-latest && chmod +x /usr/local/bin/ecs-cli
	exit 1
else
	ecs-cli -version
fi

ecs-cli configure --cluster master --region $TRAVIS_AWS_DEFAULT_REGION
test -f aws-env.$STAGE && source aws-env.$STAGE

service=$(grep -A1 services AWS-docker-compose.yml | tail -n1 | tr -cd '[[:alnum:]]')
echo Deploying $service with commit $COMMIT >&2

# Ensure docker compose file's STAGE env is empty for production
test "$STAGE" == prod && export STAGE=""

envsubst < AWS-docker-compose.yml > docker-compose-${service}.yml

ecs-cli compose --aws-profile $TRAVIS_PROFILE -p ${service} -f docker-compose-${service}.yml service up \
	--target-group-arn ${MEFE_TARGET_ARN} \
	--container-name meteor \
	--container-port 3000 \
	--create-log-groups \
	--deployment-max-percent 100 \
	--deployment-min-healthy-percent 50 \
	--timeout 7

ecs-cli compose --aws-profile $TRAVIS_PROFILE -p ${service} -f docker-compose-${service}.yml service ps

echo "END $0 $(date)"
