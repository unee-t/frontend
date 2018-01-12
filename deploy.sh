#!/bin/bash

STAGE=dev

# Usage info
show_help() {
cat << EOF
Usage: ${0##*/} [-p]

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
AWS_PROFILE=uneet-$STAGE
shift "$((OPTIND-1))"   # Discard the options and sentinel --

test "$COMMIT" || export COMMIT=$(git describe --always)

PKGURL=https://unee-t-media.s3-accelerate.amazonaws.com/frontend/commit/${COMMIT}.tar.gz
echo Checking $PKGURL exists
curl -I -f $PKGURL || exit

if ! aws configure --profile $AWS_PROFILE list
then
	echo Profile $AWS_PROFILE does not exist >&2

	if ! test "$AWS_ACCESS_KEY_ID"
	then
		echo Missing $AWS_ACCESS_KEY_ID >&2
		exit 1
	fi

	echo Attempting to setup one from the environment >&2
	aws configure set profile.uneet-${STAGE}.aws_access_key_id $AWS_ACCESS_KEY_ID
	aws configure set profile.uneet-${STAGE}.aws_secret_access_key $AWS_SECRET_ACCESS_KEY
	aws configure set profile.uneet-${STAGE}.region ap-southeast-1

	if ! aws configure --profile $AWS_PROFILE list
	then
		echo Profile $AWS_PROFILE does not exist >&2
		exit 1
	fi

fi

if ! aws configure --profile $AWS_PROFILE list
then
	echo Profile $AWS_PROFILE does not exist >&2
	exit 1
fi

if ! hash ecs-cli
then
	echo Please install https://github.com/aws/amazon-ecs-cli and ensure it is in your \$PATH
	echo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-linux-amd64-latest && chmod +x /usr/local/bin/ecs-cli
	exit 1
else
	ecs-cli -version
fi

ecs-cli configure --cluster master --region ap-southeast-1 --compose-service-name-prefix ecscompose-service-
test -f aws-env.$STAGE && source aws-env.$STAGE

service=$(grep -A1 services AWS-docker-compose.yml | tail -n1 | tr -cd '[[:alnum:]]')
echo Deploying $service with commit $COMMIT >&2

envsubst < AWS-docker-compose.yml > docker-compose-${service}.yml

ecs-cli compose --aws-profile $AWS_PROFILE -p ${service} -f docker-compose-${service}.yml service up --timeout 7


if test "$STAGE" == "prod"
then
	TAG=$(date "+$STAGE-%Y%m%d%H%M%S")
	git tag $TAG $COMMIT
	git push upstream $TAG
fi


ecs-cli compose --aws-profile $AWS_PROFILE -p ${service} -f docker-compose-${service}.yml service ps
