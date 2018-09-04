FROM jenkins/evergreen

ARG FLAVOR=null
ENV FLAVOR ${FLAVOR}

# Prepare the flavor specific parts of the distribution
# https://github.com/moby/moby/issues/35018, cannot use $user below
COPY --chown=jenkins:jenkins build/evergreen-${FLAVOR}.zip /
RUN cd / && unzip -q evergreen-${FLAVOR}.zip && rm -f evergreen-${FLAVOR}.zip

# Jenkins directory is a volume, so configuration and build history
# can be persisted and survive image upgrades
# Important: this must be done *after* all file system changes have been made
# by the Dockerfile
VOLUME ${EVERGREEN_HOME}
