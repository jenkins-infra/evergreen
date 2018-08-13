#!/bin/bash
# Note: would have used set -euo pipefail, but ./shunit2 unfortunately fails hard with this :-(.

current_directory=$(dirname "$0")
# TODO: use the $( cd blah ; ... ) trick to un-relativize path below
export PATH="$current_directory/../../tools:$PATH"

echo "Debugging: PATH=***$PATH***"

JENKINS_HOME=to_override

# shellcheck source=tests/utilities
. "$current_directory/utilities"

oneTimeSetUp() {
  setup_container_under_test

  # shellcheck disable=SC2016
  JENKINS_HOME="$( docker exec "$container_under_test" bash -c 'echo $JENKINS_HOME' )"
}

test_jenkins_failed_startup() {
  determine_container_name
  docker logs "$container_under_test" | grep "Missing flavor definition" > /dev/null
  assertEquals "Missing flavor error not found" "0" $?
}

. ./shunit2/shunit2
