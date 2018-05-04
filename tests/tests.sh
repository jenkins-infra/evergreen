#!/bin/bash
# Note: would have used set -euo pipefail, but ./shunit2 unfortunately fails hard with this :-(.

current_directory=$(dirname "$0")
export PATH="$current_directory/../tools:$PATH"

JENKINS_HOME=to_override

# shellcheck source=tests/utilities
. "$current_directory/utilities"

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
  docker exec "$container_under_test" ps aux | grep npm > /dev/null
  assertEquals "npm should be running" 0 "$?"

  docker exec "$container_under_test" ps aux | grep java > /dev/null
  assertEquals "a java VM should be running" 0 "$?"

  curl --silent "http://localhost:$TEST_PORT" > /dev/null
  assertEquals "Jenkins port should be available" 0 "$?"

  curl --silent "http://localhost:3030" > /dev/null
  assertEquals "Backend port should be available" 0 "$?"

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
  numExecutors=$( docker exec "$container_under_test" cat "$JENKINS_HOME/config.xml" | \
      grep '<numExecutors>0</numExecutors>' | tr -d ' ' )
  assertEquals "<numExecutors>0</numExecutors>" "$numExecutors"
}

# JENKINS-50195
test_not_root() {
  username=$( docker exec "$container_under_test" whoami )
  assertEquals "jenkins" "$username"

  for process_user in $( docker exec "$container_under_test" ps -o user | grep -v USER)
  do
    assertEquals "jenkins" "$process_user"
  done
}

# JENKINS-49406 check data segregation
test_plugins_are_not_exploded_under_jenkins_home() {
  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'ls $JENKINS_HOME/plugins | grep -v hpi' )
  assertEquals "" "$result"
}
test_war_is_not_exploded_under_jenkins_home() {
  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'ls $JENKINS_HOME/war' 2>&1 )
  assertNotEquals "0" "$?"
  assertEquals "ls: /evergreen/jenkins/home/war: No such file or directory" "$result"
}
test_logs_are_not_under_jenkins_home() {
  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'ls $JENKINS_HOME/logs' 2>&1 )
  assertNotEquals "0" "$?"
  assertEquals "ls: /evergreen/jenkins/home/logs: No such file or directory" "$result"
}

test_jenkins_logs_is_found_on_disk() {
  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'cat $JENKINS_VAR/logs/jenkins.log.0' | \
            grep 'Jenkins is fully up and running' )
  assertEquals "0" "$?"
}

test_essentials_telemetry_logging_is_found_on_disk() {
  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'ls $JENKINS_VAR/logs/essentials.log.0' )
  assertEquals "0" "$?"

  # shellcheck disable=SC2016
  result=$( docker exec "$container_under_test" bash -c 'cat $JENKINS_VAR/logs/essentials.log.0 | tail -1' )
  assertEquals "0" "$?"
  assertNotEquals "" "$result"

  echo "$result" | jsonlint > /dev/null
  assertEquals "0" "$?"
}

# not used for health-checking anymore, but kept for smoke testing
test_login_http_200() {
  status_code=$( curl --silent --output /dev/null --write-out "%{http_code}" "http://localhost:$TEST_PORT/login" )
  assertEquals "0" "$?"
  assertEquals "200" "$status_code"
}
# JENKINS-50294 Health checking
test_instance_identity_http_200() {
  status_code=$( curl --silent --output /dev/null --write-out "%{http_code}" "http://localhost:$TEST_PORT/instance-identity/" )
  assertEquals "0" "$?"
  assertEquals "200" "$status_code"
}
test_metrics_health_check() {
  output=/tmp/output$RANDOM.json
  status_code=$( curl --silent --output $output --write-out "%{http_code}" "http://localhost:$TEST_PORT/metrics/evergreen/healthcheck" )
  assertEquals "0" "$?"
  assertEquals "200" "$status_code"

  # Check output is json
  jsonlint < $output > /dev/null
  assertEquals "0" "$?"

  # Check things are all healthy
  result=$( jq '.[].healthy' < $output | sort -u )
  assertEquals "true" "$result"
}

# JENKINS-49811
test_logs_are_propagated() {

  result=$( $COMPOSE exec -T instance curl -s http://backend:3030/errorTelemetry | \
              jq -r '.[0].log' )
  assertEquals "$result should be not empty and JSON" "0" "$?"

  # Check output is json
  echo "$result" | jsonlint > /dev/null
  assertEquals "$result should be JSON" "0" "$?"

  # Likely going to be pretty flaky
  # Depends on https://github.com/jenkinsci/essentials-plugin/blob/0d7ee52820db08f5790d79c189a88e2237cfe902/src/main/java/io/jenkins/plugins/essentials/logging/EssentialsLoggingConfigurer.java#L34 being the first
  echo "$result" | grep EssentialsLoggingConfigurer > /dev/null
  assertEquals "$result should contain the log from the Essentials Jenkins plugin" "0" "$?"

}

# Check NPM is 5+ to make sure we do check the integrity values
# https://github.com/jenkins-infra/evergreen/pull/60#discussion_r182666012
test_npm_5_plus() {
  result=$( docker exec "$container_under_test" npm --version )
  assertEquals "5." "${result:0:2}"
}

# Ensure that we can successfully connect to only Let's Encrypt authorized
# sites. See JEP-307
test_jep_307() {
  result=$( docker exec "$container_under_test" curl -s https://jenkins.io/ )
  assertEquals "jenkins.io should be OK" "0" "$?"

  # Incrementals, like https://repo.jenkins-ci.org/incrementals/org/jenkins-ci/main/jenkins-war/maven-metadata.xml
  result=$( docker exec "$container_under_test" curl -s https://repo.jenkins-ci.org )
  assertEquals "Incrementals repo should be OK" "0" "$?"

  result=$( docker exec "$container_under_test" curl -s https://sonic.com/ )
  assertEquals "everything else should be KO" "60" "$?"
}

. ./shunit2/shunit2
