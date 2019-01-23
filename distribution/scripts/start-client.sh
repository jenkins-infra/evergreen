#!/bin/bash

# Wrapper to force the client to wait for the backend to become available
# Should only be useful during development
set -euo pipefail

if [ ! -z "${DEVELOPMENT:-}" ]; then
  sleepTime=8
  echo "DEVELOPMENT MODE: client will wait $sleepTime before starting, to give time to the backend to start and receive a first UL"
  sleep $sleepTime

  maxAttempts=30
  until curl -s "$EVERGREEN_ENDPOINT" --output /dev/null ; do
    maxAttempts=$(( maxAttempts - 1 ))
    if [[ $maxAttempts -le 0 ]]; then
      >&2 echo "Maximum number of attempts reached: exiting"
      exit 1
    fi
    >&2 echo "Backend is unavailable - sleeping for some more time"
    sleep 1
  done

else
  echo "Client is starting up"
fi

export PATH=/usr/bin:/usr/local/bin:$PATH
exec npm run start
