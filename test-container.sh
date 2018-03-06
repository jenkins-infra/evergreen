#!/bin/bash

set -euo pipefail

### FUNCTIONS / SETUP

# will use the local build, but could also be used to test a remote image
# TODO: pass an image:tag param?

C_NAME=evergreen-testing-$RANDOM
exit_code=0

cleanup () {
  exit_code=$?
  docker kill $C_NAME 2>/dev/null >/dev/null || echo "Already dead."
  docker rm   $C_NAME 2>/dev/null >/dev/null || echo "Already removed."
  exit $exit_code
}

trap cleanup EXIT ERR INT TERM

find_free_port() {
  candidate_port=$(( ( $RANDOM % ( 65535 - 1024 ) )  + 1024 ))
  used_ports=$( netstat -ntap 2> /dev/null | tr -s ' ' | cut -d ' ' -f4 | grep ':' | awk -F ":" '{print $NF}' )
  echo $candidate_port
}

### HERE STARTS THE REAL MEAT

TEST_PORT=$(find_free_port)
echo "Using the port $TEST_PORT"

# TODO use docker-compose to use network and avoid all this
echo "Start container under test and wait a bit for its startup:"
docker run --name $C_NAME -p $TEST_PORT:8080 -d jenkins/evergreen:latest
sleep 10

echo "Connect to Jenkins"
curl --silent http://localhost:$TEST_PORT > output.html

echo "Check content"
grep "Authentication required" output.html > /dev/null
