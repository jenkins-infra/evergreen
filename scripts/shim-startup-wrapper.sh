#!/bin/bash
set -euo pipefail
echo "*TEMPORARY* script to download Jenkins.war, to let us iterate while the client isn't yet able to do it in the right way."

TARGET=/usr/share/jenkins/jenkins.war
SOURCE=http://mirrors.jenkins.io/war-stable/latest/jenkins.war
SHA_SOURCE=${SOURCE}.sha256

download_war() {
  echo "Downloading $SOURCE into $TARGET"
  wget $SOURCE -O $TARGET
}

if test -f $TARGET; then
  echo "$TARGET already exists, checking checksum."
  cd $( dirname $TARGET)
  curl -s $SHA_SOURCE > /tmp/checksum_file
  if sha256sum /tmp/checksum_file > /dev/null ; then
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
install-plugins.sh configuration-as-code:experimental

exec jenkins.sh $@
