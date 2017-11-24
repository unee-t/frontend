# Unee-T

* [How to test with Bugzilla in a local environment](https://unee-t-media.s3-accelerate.amazonaws.com/frontend/MEFE.mp4)
* [How to deploy to AWS ECS](https://s.natalian.org/2017-10-27/frontend-updates.mp4)

# Meteor builds

The canonical master branch CI build location is <https://unee-t-media.s3-accelerate.amazonaws.com/frontend/master.tar.gz>

To discover other branches:

	aws --profile lmb-dev s3 ls s3://unee-t-media/frontend/

Every commit is also uploaded to:

	aws --profile lmb-dev s3 ls s3://unee-t-media/frontend/commit

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
