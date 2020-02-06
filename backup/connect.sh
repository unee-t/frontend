#!/bin/bash

STAGE=dev

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
AWS_PROFILE=uneet-$STAGE
shift "$((OPTIND-1))"   # Discard the options and sentinel --

getparam () {
	aws --profile ins-${STAGE} ssm get-parameters --names "$1" --with-decryption --query Parameters[0].Value --output text
}

mongo "mongodb+srv://$(getparam MONGO_MASTER_USERNAME):$(getparam MONGO_MASTER_PASSWORD)@$(getparam MONGO_CONNECT)"
