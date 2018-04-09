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

dump_war_metadata() {
  echo "*** WAR metadata"
  md5sum "$JENKINS_WAR"
  unzip -c "$JENKINS_WAR" META-INF/MANIFEST.MF | grep Version
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
aria2c -x 4 -i /plugins.aria
mkdir -p "$JENKINS_HOME/plugins/"

custom_plugins=$( find /usr/share/jenkins/ref/plugins/ )
for downloaded_plugin in *.hpi
do
  if echo "$custom_plugins" | grep "$downloaded_plugin" > /dev/null ; then
    echo "NOT clobbering the preinstalled $downloaded_plugin with the downloaded one"
  else
    echo "Moving $downloaded_plugin to $JENKINS_HOME/plugins/"
    mv "$downloaded_plugin" "$JENKINS_HOME/plugins/"
  fi
done

rm -rf $download_tmp
cd "$JENKINS_HOME"

dump_war_metadata
exec jenkins.sh "$@"
