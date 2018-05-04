#!/bin/bash
set -euo pipefail
echo "*TEMPORARY* script to download Jenkins.war and plugins, to let us iterate while the client isn't yet able to do it in the right way."

export JENKINS_WAR=${EVERGREEN_HOME}/jenkins.war

/usr/local/bin/download-latest-war.sh

dump_war_metadata() {
  echo "*** WAR metadata"
  md5sum "$JENKINS_WAR"
  unzip -c "$JENKINS_WAR" META-INF/MANIFEST.MF | grep Version
}

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
