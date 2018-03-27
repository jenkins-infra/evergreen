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

# JENKINS-49861
test_no_executor() {
  numExecutors=$( docker exec $container_under_test cat "$JENKINS_HOME/config.xml" | \
      grep '<numExecutors>0</numExecutors>' | tr -d ' ' )
  assertEquals "<numExecutors>0</numExecutors>" "$numExecutors"
}

# JENKINS-50195
test_not_root() {
  username=$( docker exec $container_under_test whoami )
  assertEquals "jenkins" "$username"

  for process_user in $( docker exec $container_under_test ps -o user | grep -v USER)
  do
    assertEquals "jenkins" "$process_user"
  done
}

# JENKINS-49406 check data segregation
test_plugins_are_not_exploded_under_jenkins_home() {
  # shellcheck disable=SC2016
  result=$( docker exec $container_under_test bash -c 'ls $JENKINS_HOME/plugins | grep -v hpi' )
  assertEquals "" "$result"
}
test_war_is_not_exploded_under_jenkins_home() {
  # shellcheck disable=SC2016
  result=$( docker exec $container_under_test bash -c 'ls $JENKINS_HOME/war' 2>&1 )
  assertNotEquals "0" "?"
  assertEquals "ls: /evergreen/jenkins/home/war: No such file or directory" "$result"
}

. ./shunit2/shunit2
