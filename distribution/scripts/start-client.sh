#!/bin/sh

# Wrapper to force the client to wait for the backend to become available
# Should only be useful during development
set -euo pipefail

sleepTime=8
if [ ! -z ${DEVELOPMENT:-} ]; then
  echo "DEVELOPMENT MODE: client will wait $sleepTime before starting, to give time to the backend to start and receive a first UL"
  sleep $sleepTime
else
  echo "Client is starting up"
fi

maxAttempts=30

until curl -s $EVERGREEN_ENDPOINT --output /dev/null ; do
  maxAttempts=$(( $maxAttempts - 1 ))
  if [[ $maxAttempts <= 0 ]]; then
    >&2 echo "Maximum number of attempts reached: exiting"
    exit 1
  fi
  >&2 echo "Backend is unavailable - sleeping for some more time"
  sleep 1
done

exec /usr/local/bin/npm run client
