#!/bin/bash
# Note: would have used set -euo pipefail, but ./shunit2 unfortunately fails hard with this :-(.


# shellcheck source=tests/utilities
. "$(dirname $0)/utilities"
JENKINS_HOME=to_override

# trick to silence shellcheck which does not handle very well variables coming from sourced file
export container_under_test=${container_under_test:?}

oneTimeSetUp() {
  setup_container_under_test
  # shellcheck disable=SC2016
  JENKINS_HOME="$( docker exec "$container_under_test" bash -c 'echo $JENKINS_HOME' )"
}

oneTimeTearDown() {
  cleanup
}

test_smoke() {
  curl --silent "http://localhost:$TEST_PORT" > /dev/null
  assertEquals "Bad exit" 0 $?
}

# JENKINS-49864
test_docker_CLI_available() {
  docker exec "$container_under_test" which docker > /dev/null
  assertEquals "docker found in the PATH" 0 $?

  # Check that not only something called docker can be found on the PATH
  # but is actually looking more like it using a specific command call
  output=$( docker exec "$container_under_test" docker version 2>&1 )
  assertEquals "error is expected since no Docker daemon $?" 1 $?

  echo "$output" | \
      grep "Cannot connect to the Docker daemon" > /dev/null
  assertEquals "expected message about daemon unavailable" 0 $?
}

test_no_executor() {
  numExecutors=$( docker exec $container_under_test cat "$JENKINS_HOME/config.xml" | \
      grep '<numExecutors>0</numExecutors>' | tr -d ' ' )
  assertEquals "<numExecutors>0</numExecutors>" "$numExecutors"
}

. ./shunit2/shunit2
