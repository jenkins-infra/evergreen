#!/bin/bash

set -euo pipefail

### FUNCTIONS / SETUP

# will use the local build, but could also be used to test a remote image
# TODO: pass an image:tag param?

C_NAME=evergreen-testing-$RANDOM
exit_code=0
output=output.html

cleanup () {
  exit_code=$?
  docker kill $C_NAME 2>/dev/null >/dev/null || echo "Already dead."
  rm -f $output
  exit $exit_code
}

trap cleanup EXIT ERR INT TERM

find_free_port() {
  candidate_port=$(( ( $RANDOM % ( 65535 - 1024 ) )  + 1024 ))
  used_ports=$( netstat -ntap 2> /dev/null | tr -s ' ' | cut -d ' ' -f4 | grep ':' | awk -F ":" '{print $NF}' )
  echo $candidate_port
}

### HERE STARTS THE REAL MEAT
docker
TEST_PORT=$(find_free_port)
echo "Using the port $TEST_PORT"

# TODO use docker-compose to use network and avoid all this
echo "Start container under test and wait a bit for its startup:"
docker run --rm --name $C_NAME -p $TEST_PORT:8080 -d jenkins/evergreen:latest
sleep 2

set +e
max_attempts=10
while true
do
  if ( docker logs $C_NAME | grep "Jenkins is fully up and running" ); then
    echo "Started, running tests."
    break;
  elif (( $max_attempts < 1 )); then
    echo "Jenkins did not start before timeout. Tests are expected to fail."
    break;
  else
    echo "Waiting for Jenkins startup a bit more..."
  fi
  sleep 3
  max_attempts=$(( max_attempts -1 ))
done
set -e
#sleep 10 # is there a better way? Like checking logs for

echo "Connect to Jenkins"
curl --silent http://localhost:$TEST_PORT > $output

echo "Check content"
grep "Authentication required" $output > /dev/null
