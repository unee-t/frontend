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

# Debugging with VScode

[Background reading](https://github.com/Microsoft/vscode-recipes/blob/master/meteor/README.md#configure-meteor-to-run-in-debug-mode)

* `cd .vscode; curl -O https://media.dev.unee-t.com/2018-07-05/launch.json` for example, edit this to point to where your browser binary lives
* `npm run debug`... you need to run this manually on the CLI
* Meteor: Node to attach & debug server side
* Meteor: Chrome to debug client side

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

# Tips

## How do I figure out the email of the logged in user?

Run in browser's developer console:

	Meteor.user().emails[0].address

## How to find user account on MongoDB given an email address foo@example.com?

	./backup/connect.sh
	db.users.findOne({'emails.address': 'foo@example.com'})

## How do I set up for local development?

Assuming `.env` is already setup, you need to populate yours users db, by cross
referencing an existing user in the Bugzilla backend. For example running in
the dev tools of your browser:

	Accounts.createUser({ email: 'leonel@mailinator.com', password: 'leonel', profile: { bzLogin: 'leonel@mailinator.com', bzPass: 'leonel' }})

Ensure it worked by looking at the `npm start` log.

Next in `meteor mongo`, you need to verify the address like so:

	db.users.update({'emails.address': 'leonel@mailinator.com'}, {$set : {'emails.0.verified': true}})

## How to test the notifications / email templates?

Refer to
[simulate.sh](https://github.com/unee-t/lambda2sns/blob/master/tests/simulate.sh)
though you need to tweak the
[events](https://github.com/unee-t/lambda2sns/tree/master/tests/events) to map
to the bugzillaCreds **id** from `db.users.find().pretty()`
