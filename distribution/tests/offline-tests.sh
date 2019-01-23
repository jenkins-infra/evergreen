#!/bin/bash
# Note: would have used set -euo pipefail, but ./shunit2 unfortunately fails hard with this :-(.

current_directory=$(dirname "$0")
export PATH="$current_directory/../../tools:$PATH"

# shellcheck source=tests/utilities
. "$current_directory/utilities"


oneTimeSetUp() {
  setup_container_under_test
}

# JENKINS-49864
test_docker_CLI_available() {
  docker exec "$container_under_test" docker --version > /dev/null
  assertEquals "docker found in the PATH" 0 $?

  # Check that not only something called docker can be found on the PATH
  # but is actually looking more like it using a specific command call
  output=$( docker exec "$container_under_test" docker --version 2>&1 | cut -d ' ' -f 1,2 )
  assertEquals "Command should succeed" 0 "$?"
  assertEquals "Should start with 'Docker version ...'" "Docker version" "$output"
}

# JENKINS-50195
test_not_root() {
  username=$( docker exec "$container_under_test" whoami )
  assertEquals "Username should be root" "root" "$username"

  docker exec "$container_under_test" ps -o user= -o comm= | \
    grep -E 'jenkins|npm' | \
    while read -r process_user
  do
    currentUser=$( echo "$process_user" | awk '{print $1}' )
    assertEquals "User for '$process_user' should be jenkins" "jenkins" "$currentUser"
  done
}


# Check NPM is 5+ to make sure we do check the integrity values
# https://github.com/jenkins-infra/evergreen/pull/60#discussion_r182666012
test_npm_5_plus() {
  result=$( docker exec "$container_under_test" npm --version )
  assertEquals "Result should be 6." "6." "${result:0:2}"
}
test_node_version() {
  result=$( docker exec "$container_under_test" node --version )
  assertEquals "Result should be v10." "v10" "${result:0:3}"
}

# Ensure that we can successfully connect to only Let's Encrypt authorized
# sites. See JEP-307
test_jep_307() {
  result=$( docker exec "$container_under_test" curl -s https://jenkins.io/ )
  assertEquals "jenkins.io should be OK" "0" "$?"

  # Incrementals, like https://repo.jenkins-ci.org/incrementals/org/jenkins-ci/main/jenkins-war/maven-metadata.xml
  result=$( docker exec "$container_under_test" curl -s https://repo.jenkins-ci.org )
  assertEquals "Incrementals repo should be OK" "0" "$?"

}

# JENKINS-53059
test_INSECURE_SHOW_ADMIN_PASSWORD_can_be_unset() {
  # Avoid executing this for the base image
  if [ ! -z "${FLAVOR}" ]; then
    result=$( docker run --rm "jenkins/evergreen:$FLAVOR" /evergreen/scripts/jenkins-evergreen.sh )
    # Expected to fail, but because war is missing. Admin password must have been generated,
    # and final expected error line is "Error: Unable to access jarfile /evergreen/jenkins/home/jenkins.war"
    assertNotEquals "Should have failed to start up (war is absent)" "0" "$?"

    echo "$result" | grep -v '[admin password] '
    assertEquals "Line with generated password should not have been found" "0" "$?"

    result=$( docker logs "$container_under_test" |
        grep -e '^Error: Unable to access jarfile /evergreen/data/jenkins/home/jenkins.war')
    assertEquals "Should not have been able to start jenkins.war" "0" "$?"
  fi;
}

test_docker_flavor_custom_supervisordconf() {
  # Ensure that our custom supervisord.conf is present
  result=$(docker run --rm jenkins/evergreen:docker-cloud grep "socat" /evergreen/config/supervisord.conf )
  assertEquals "The wrong supervisord.conf exists in the container" "0" "$?"
}

# JENKINS-54598
test_java_version() {
  [[ "$FLAVOR" = "java11-docker-cloud" ]] || startSkipping
  result=$(docker run --rm jenkins/evergreen:java11-docker-cloud java -version 2>&1 \
    | grep "(build 11.")
  assertEquals "java 11 should be installed" 0 "$?"
  [[ "$FLAVOR" = "java11-docker-cloud" ]] || endSkipping
}

. ./shunit2/shunit2
