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

  echo "PWD=$( pwd )"

  upload_update_level "./tests/rollback/1-ingest-ok.json"

  wait_for_jenkins
  # shellcheck disable=SC2016
  JENKINS_HOME="$( docker exec "$container_under_test" bash -c 'echo $JENKINS_HOME' )"
}

test_rollback() {

  # Check UL is the correct one (UL 1 or UL 2?!)
  docker exec "$container_under_test" bash -c 'ls $EVERGREEN_DATA'
  # extract 2 from `"level":2` from the updates.json file
  correctUL=$( docker exec "$container_under_test" bash -c 'cat $EVERGREEN_DATA/updates.json' | \
                                    grep --only-matching '"level":.' | \
                                    cut -d : -f 2  )
  assertEquals "Command should have succeeded" 0 "$?"

  assertEquals "Should be UL 2" 2 "$correctUL"

  # upload borked update level to backend
  echo "UPLOADING BROKEN UPDATE LEVEL (MISSING CREDENTIALS PLUGIN)"
  upload_update_level "./tests/rollback/2-ingest-borked.json"

  # wait enough until upgrade happens, then rollback: check UL is the same as before
  now=$( date --iso-8601=seconds )
  echo "Waiting for Jenkins to restart a first time to broken UL3, then back to UL2 (using logs --since=$now)"
  wait_for_jenkins "$now"

  # let's now check the upload and upgrade attempt to borked UL3 *actually* happened
  # because if this didn't, then we'd still on UL2, but not testing there was a rollback somewhere
  beforeLastUpdate=$( docker exec "$container_under_test" bash -c 'cat $EVERGREEN_DATA/updates.auditlog' | tail -2 | head -1 | jq -r .updateLevel )
  lastUpdate=$( docker exec "$container_under_test" bash -c 'cat $EVERGREEN_DATA/updates.auditlog' | tail -1 | jq -r .updateLevel )

  assertEquals "Previous UL should be 3, the one expected to be rolled back" 3 "$beforeLastUpdate"
  assertEquals "UL should be 2 (gone back to 2 from borked 3)" 2 "$lastUpdate"

}

. ./shunit2/shunit2
