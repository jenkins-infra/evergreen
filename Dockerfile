FROM openjdk:8-jre-alpine

ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG http_port=8080
ARG agent_port=50000

ENV EVERGREEN_HOME /evergreen
ENV JENKINS_HOME ${EVERGREEN_HOME}/jenkins/home
ENV JENKINS_VAR ${EVERGREEN_HOME}/jenkins/var
ENV JENKINS_AGENT_PORT ${agent_port}
ENV EVERGREEN_ENDPOINT=http://127.0.0.1:9292
ENV COPY_REFERENCE_FILE_LOG $JENKINS_HOME/copy_reference_file.log
ENV JENKINS_UC https://updates.jenkins.io
ENV JENKINS_UC_EXPERIMENTAL=https://updates.jenkins.io/experimental

ENV JAVA_OPTS="-Djava.awt.headless=true -Djenkins.model.Jenkins.WORKSPACES_DIR=${JENKINS_VAR}/\${ITEM_FULL_NAME}/workspace -Djenkins.model.Jenkins.BUILDS_DIR=$JENKINS_VAR/\${ITEM_FULL_NAME}/builds"
ENV JENKINS_OPTS="--webroot=${JENKINS_VAR}/war --pluginroot=${JENKINS_VAR}/plugins"

RUN mkdir -p /usr/share/jenkins/ref/ && \
    mkdir ${EVERGREEN_HOME} && \
    mkdir ${EVERGREEN_HOME}/jenkins/ && \
    mkdir ${JENKINS_HOME}

# for main web interface:
EXPOSE ${http_port}
# will be used by attached agents:
EXPOSE ${agent_port}


# FIXME REMOVE (to ease iteration/speed just for now), see also shim-startup-wrapper.sh
RUN wget --quiet https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war -O ${EVERGREEN_HOME}/jenkins.war
RUN apk add --no-cache curl aria2 # used by shim-startup-wrapper.sh
COPY scripts/casc-dependencies.aria /casc-dependencies.aria

# Add the system dependencies for running Jenkins effectively
#
# The only dependencies for Jenkins Essentials are:
#   * supervisor
#   * nodejs
RUN apk add --no-cache git \
                        openssh-client \
                        unzip \
                        bash \
                        supervisor \
                        nodejs \
                        ttf-dejavu

# TODO: add a checksum check?
RUN cd /tmp && \
    wget --quiet https://download.docker.com/linux/static/stable/x86_64/docker-17.12.1-ce.tgz --output-document /tmp/docker.tar.gz && \
    tar xvzf docker.tar.gz && \
    mv docker/* /usr/local/bin && \
    rmdir docker && \
    rm docker.tar.gz

# Jenkins is run with user `jenkins`, uid = 1000
# If you bind mount a volume from the host or a data container,
# ensure you use the same uid
RUN addgroup -g ${gid} ${group} \
    && adduser -h "$JENKINS_HOME" -u ${uid} -G ${group} -s /bin/bash -D ${user}

#######################
## Construct the image
#######################

RUN mkdir -p /usr/local/bin
COPY build/jenkins.sh /usr/local/bin/
COPY build/jenkins-support /usr/local/bin/
COPY scripts/shim-startup-wrapper.sh /usr/local/bin

# Prepare the evergreen-client configuration
COPY client ${EVERGREEN_HOME}/client
COPY essentials.yaml ${EVERGREEN_HOME}

# FIXME (?): what if the end users touches the config value?
# as is, we'll override it.
COPY build/configuration-as-code/target/configuration-as-code.hpi /usr/share/jenkins/ref/plugins/configuration-as-code.hpi
COPY jenkins-configuration.yaml /usr/share/jenkins/ref/jenkins.yaml
ENV CASC_JENKINS_CONFIG=$JENKINS_HOME/jenkins.yaml

RUN chown -R $user:$group $EVERGREEN_HOME

# Jenkins directory is a volume, so configuration and build history
# can be persisted and survive image upgrades
VOLUME ${EVERGREEN_HOME}

# Ensure the supervisord configuration is copied and executed by default such
# that the Jenkins and evergreen-client processes both execute properly
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

WORKDIR $EVERGREEN_HOME
USER $user
