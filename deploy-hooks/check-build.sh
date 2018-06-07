#!/bin/bash

test "$COMMIT" || export COMMIT=$(git rev-parse --short HEAD)

PKGURL=https://unee-t-media.s3-accelerate.amazonaws.com/frontend/commit/${COMMIT}.tar.gz
echo Checking $PKGURL exists
curl -I -f $PKGURL || exit 1
