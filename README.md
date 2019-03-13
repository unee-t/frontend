# Unee-T

<img src="https://media.dev.unee-t.com/2018-12-10/Unee-T_high_level_architecture.png" alt="Overview">

* [How to test with Bugzilla in a local environment](https://unee-t-media.s3-accelerate.amazonaws.com/frontend/MEFE.mp4)
* [ECS deploy](https://unee-t-media.s3-accelerate.amazonaws.com/2017/ecs-deploy.mp4) with `./deploy.sh`

# Demo - How to see how it works:

* You can either go the demo environment, described [here](https://documentation.unee-t.com/2018/03/01/introduction-to-the-demo-environment/) for the functionalities that we currently in production.
* You can also go to Figma to see the things we are currently working on.
	* [Manage Notifications](https://www.figma.com/proto/SgLcXdmBih1JxVq1lupMiPtr/Unee-T-Designs?node-id=1969%3A62&scaling=scale-down).
	* [Creating a new inventory for a unit and adding an item to that inventory](https://new.figma.com/proto/SgLcXdmBih1JxVq1lupMiPtr/Unee-T-Designs?node-id=1483%3A3763&scaling=scale-down&redirected=1).
* Figma also has an android and iPhone version: Figma Mirror.

# Environment variables

They are securely managed in AWS's [parameter store](https://ap-southeast-1.console.aws.amazon.com/ec2/v2/home?region=ap-southeast-1#Parameters:sort=Name). The variables are retrieved via [an environment setup script](https://github.com/unee-t/frontend/blob/master/aws-env.dev), which is utilised by `deploy.sh`.

For local development, use `./env-setup.bash` assuming you have been access to the `uneet-dev` development environment.

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

1. Make a backup snapshot of the development Mongo database using `backup/dump.sh`
2. `meteor reset` to clear state
3. `npm run start` to start the mongo service
3. `mongorestore -h 127.0.0.1 --port 3001 -d meteor $(date "+dev-%Y%m%d")/meteor`

## How to create users in the case my MongoDB is lacking the users?

To check the current users, connect to your MongoDB and run:

	db.users.find({}, {'emails.address': 1, _id: 0}).map(d => d.emails[0].address).join('\n')

If your Frontend datastore MongoDB out of sync with your [Bugzilla database's
profiles](https://documentation.unee-t.com/2018/03/01/introduction-to-the-demo-environment/),
you need to create the users in the users manually:

	Accounts.createUser({ email: 'leonel@mailinator.com', password: 'leonel', profile: { bzLogin: 'leonel@mailinator.com', bzPass: 'leonel' }})

Ensure it worked by looking at the `npm start` log. Next you might want to verify each user's email address.

	db.users.update({'emails.address': 'leonel@mailinator.com'}, {$set : {'emails.0.verified': true}})

## How to test the notifications / email templates?

Refer to
[simulate.sh](https://github.com/unee-t/lambda2sns/blob/master/tests/simulate.sh)
though you need to tweak the
[events](https://github.com/unee-t/lambda2sns/tree/master/tests/events) to map
to the bugzillaCreds **id** from `db.users.find().pretty()`

## Migrations: Not migrating, control is locked.

	Migrations.unlock()
	Migrations.migrateTo('latest')

## error: Error: url must be absolute and start with http:// or https://

Your `.env` file is not set up correctly, consider `./env-setup.bash`
