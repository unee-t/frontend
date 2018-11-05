#!/bin/bash

if test -f .env
then
	echo .env already exists. Stopping.
	exit
fi

ssm() {
	echo $(aws --profile uneet-dev ssm get-parameters --names $1 --with-decryption --query Parameters[0].Value --output text)
}

cat << EOF > .env
BUGZILLA_ADMIN_KEY=$(ssm BUGZILLA_ADMIN_KEY)
MAIL_URL=smtps://$(ssm SES_SMTP_USERNAME):$(ssm SES_SMTP_PASSWORD)@email-smtp.us-west-2.amazonaws.com:465
CLOUDINARY_URL=https://api.cloudinary.com/v1_1/unee-t-staging/image/upload
CLOUDINARY_PRESET=$(ssm CLOUDINARY_PRESET)
API_ACCESS_TOKEN=$(ssm API_ACCESS_TOKEN)
FROM_EMAIL="Local Unee-T Case <case.local@unee-t.com>"
APIENROLL_LAMBDA_URL=http://localhost:4000
INVITE_LAMBDA_URL=http://localhost:9000
UNIT_CREATE_LAMBDA_URL=http://localhost:4001/create
STAGE=dev
DOMAIN=unee-t.com
PDFGEN_LAMBDA_URL=https://pdfgen.dev.unee-t.com
PDFCONVERT_LAMBDA_URL=https://prince.dev.unee-t.com
EOF
