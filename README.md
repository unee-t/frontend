# Unee-T

* [How to test with Bugzilla in a local environment](https://unee-t-media.s3-accelerate.amazonaws.com/frontend/MEFE.mp4)
* [ECS deploy](https://unee-t-media.s3-accelerate.amazonaws.com/2017/ecs-deploy.mp4) with `./deploy.sh`

# Environment variables

They are securely managed in AWS's [parameter store](https://ap-southeast-1.console.aws.amazon.com/ec2/v2/home?region=ap-southeast-1#Parameters:sort=Name). The variables are retrieved via [an environment setup script](https://github.com/unee-t/frontend/blob/master/aws-env.dev), which is utilised by `deploy.sh`.

For local development, copy `.env.sample` to `.env`. The values of the environment variables can be obtained from other developers via [Unee-T Slack](https://unee-t.slack.com/messages/C6UM93HD2).

# Deployment

Happens automatically on master on the development AWS account 8126-4485-3088
with AWS_PROFILE `uneet-dev`. Travis CI deployments made via pull request will fail since it will
not have access to `AWS_SECRET_ACCESS_KEY`.

Production deployment on AWS account 1924-5899-3663 is done manually via
`./deploy.sh -p` via the AWS_PROFILE `aws-prod` only once the **build is tagged**.

# Logs

Frontend logs to the [meteor log group in
CloudWatch](https://ap-southeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-southeast-1#logs:),
which is controlled by the [compose
file](https://github.com/unee-t/frontend/blob/master/AWS-docker-compose-meteor.yml#L16).

# Meteor builds

The canonical master branch CI build location is <https://unee-t-media.s3-accelerate.amazonaws.com/frontend/master.tar.gz>

To discover other branches:

	aws --profile uneet-dev s3 ls s3://unee-t-media/frontend/

Every commit is also uploaded to:

	aws --profile uneet-dev s3 ls s3://unee-t-media/frontend/commit

[Commits are expired after 90 days](https://s3.console.aws.amazon.com/s3/buckets/unee-t-media/?region=ap-southeast-1&tab=management)

## Setup

1. Install Meteor
`https://www.meteor.com/install`

1. Install dependencies
```shell
npm install
```

## Start App
```shell
npm start
```
