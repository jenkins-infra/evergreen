#!/bin/bash
set -euxo pipefail

TARGET=${EVERGREEN_HOME}/jenkins.war
SOURCE=""

computeSource() {
  # --insecure since we override CA certificates in the image
  # not great, but the whole thing is temporary, so that's OK I think
  latestVersion=$( curl --silent http://repo.jenkins-ci.org/incrementals/org/jenkins-ci/main/jenkins-war/maven-metadata.xml | \
                     grep latest | \
                     sed 's#^.*<latest>\(.*\)</latest>.*#\1#' \
                  )

  [[ ! -z "$latestVersion" ]] || exit 1

  echo "https://repo.jenkins-ci.org/incrementals/org/jenkins-ci/main/jenkins-war/$latestVersion/jenkins-war-$latestVersion.war"
}

get_checksum() {
  checksum=$( curl --insecure --silent $SOURCE.md5 )
  echo "$checksum  jenkins.war"
}

download_war() {
  echo "Downloading $SOURCE into '$TARGET'"
  wget $SOURCE -O "$TARGET"
}

SOURCE=$( computeSource )
echo "Going to download from $SOURCE if needed"

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
