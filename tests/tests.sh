#!/bin/bash

. $(dirname $0)/utilities

oneTimeSetUp() {
  setup_container_under_test
}

oneTimeTearDown() {
  cleanup
}

test_smoke() {
  curl --silent http://localhost:$TEST_PORT > /dev/null
  assertEquals "Bad exit" 0 $?
}

# JENKINS-49864
test_docker_CLI_available() {
  docker exec $container_under_test which docker > /dev/null
  assertEquals "docker found in the PATH" 0 $?

  # Check that not only something called docker can be found on the PATH
  # but is actually looking more like it using a specific command call
  output=$( docker exec $container_under_test docker version 2>&1 )
  assertEquals "error is expected since no Docker daemon $?" 1 $?

  echo "$output" | \
      grep "Cannot connect to the Docker daemon" > /dev/null
  assertEquals "expected message about daemon unavailable" 0 $?
}

. ./shunit2/shunit2
