#!/bin/bash
set -euo pipefail
echo "*TEMPORARY* script to download Jenkins.war, to let us iterate while the client isn't yet able to do it in the right way."

TARGET=${EVERGREEN_HOME}/jenkins.war
export JENKINS_WAR=$TARGET
SOURCE=https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war

get_checksum() {
  checksum=$( curl --silent https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/fingerprints/ | \
    grep linux-jenkins.war | \
    cut -d '"' -f 4 | \
    cut -d / -f 3 )
  echo "$checksum  jenkins.war"
}

download_war() {
  echo "Downloading $SOURCE into $TARGET"
  wget $SOURCE -O "$TARGET"
}

if test -f "$TARGET"; then
  echo "$TARGET already exists, checking checksum."
  # shellcheck disable=SC2086
  cd "$( dirname $TARGET )"
  get_checksum > /tmp/checksum_file
  cat /tmp/checksum_file
  if md5sum -c /tmp/checksum_file > /dev/null ; then
    echo "File has the right checksum, no download."
  else
    echo "WRONG checksum, need to download again."
    download_war
  fi

else
  echo "No WAR file found, downloading."
  download_war
fi


# FIXME: Only hardcoded to install casc,
# not following essentials.yaml declaration
# On purpose to make the startup faster
# anyway the whole file is a *shim* :P
download_tmp=/tmp/download-casc-plugins$RANDOM
mkdir "$download_tmp"
cd $download_tmp
aria2c -x 4 -i /casc-dependencies.aria
mkdir -p "$JENKINS_HOME/plugins/"
mv ./*.hpi "$JENKINS_HOME/plugins/"
rm -rf $download_tmp
cd "$JENKINS_HOME"

exec jenkins.sh "$@"
