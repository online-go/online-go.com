#!/bin/bash

# We need to use host.docker.internal to access the host machine from Docker
# so that it's recognisable as a CSRF bypass at the backend in local development
# Note: The backend Django settings now include http://host.docker.internal:8080 in CSRF_TRUSTED_ORIGINS
HOST_IP="host.docker.internal"

# This script is intended to be called from the package.json 
# with the PLAYWRIGHT_DOCKER environment variable set. 
if [ -z "${PLAYWRIGHT_DOCKER}" ]; then
    echo "Error: PLAYWRIGHT_DOCKER environment variable is not set"
    exit 1
fi

# Mounts made to allow playwright in docker to write out smoketest snapshots 
# and failed test results if it needs to.

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$(pwd):/app" \
  -v "$(pwd)/e2e-tests/smoke/smoketests.spec.ts-snapshots:/app/e2e-tests/smoke/smoketests.spec.ts-snapshots" \
  -v "$(pwd)/test-results:/app/test-results" \
  -w /app \
  -e FRONTEND_URL=http://$HOST_IP:8080 \
  -e CI=$CI \
  $PLAYWRIGHT_DOCKER \
  npx playwright test "$@"