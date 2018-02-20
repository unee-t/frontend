#!/bin/bash

test "$COMMIT" || export COMMIT=$(git describe --always)

PKGURL=https://unee-t-media.s3-accelerate.amazonaws.com/frontend/commit/${COMMIT}.tar.gz
echo Checking $PKGURL exists
curl -I -f $PKGURL || exit 1
