#!/bin/bash
set -euo pipefail

current_dir=$( dirname "$0" )
build_dir=$( mkdir -p "$current_dir/../build/plugins" && cd "$current_dir/../build/plugins" && pwd )
tools_dir=$( cd "$current_dir/../tools" && pwd )
export PATH=$tools_dir:$PATH

# shellcheck disable=SC2013
for line in $( grep -ve '^#' "$current_dir/plugins-to-build.list" )
do
  cd "$build_dir"
  org=$( echo "$line" | cut -d':' -f1 )
  repo=$( echo "$line" | cut -d':' -f2 )
  branch=$( echo "$line" | cut -d':' -f3 )

  repo_url=https://github.com/$org/$repo.git
  local_path=$build_dir/$repo

  if [[ -d $local_path ]]; then
    echo "$local_path already exists, nothing to do. Wipe out if you wish to update or clone again."
  else
    echo "Cloning $repo_url into $local_path, branch=$branch"
    git clone --depth 1 --branch "$branch" "$repo_url" "$local_path"
  fi

  artifactId=${repo//-plugin/}
  if [[ -f "$local_path/target/$artifactId.hpi" ]] ; then
    echo "hpi found under $local_path, no build. Wipe out if you wish to rebuild the plugin."
  else
    echo "Building $local_path (without tests...)"
    cd "$local_path"
    mvn --batch-mode -DskipTests clean package
  fi
done

echo "Copying HPIs"
find "$build_dir" -maxdepth 3 -name "*.hpi" -exec cp "{}" "$build_dir/.." \;
