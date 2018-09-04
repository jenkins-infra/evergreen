FROM node:10-alpine

ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG http_port=8080
ARG agent_port=50000

ENV EVERGREEN_ENDPOINT=https://evergreen.jenkins.io/
ENV EVERGREEN_HOME /evergreen

ENV JENKINS_HOME ${EVERGREEN_HOME}/jenkins/home
ENV JENKINS_WAR ${JENKINS_HOME}/jenkins.war
ENV JENKINS_VAR ${EVERGREEN_HOME}/jenkins/var
ENV JENKINS_AGENT_PORT ${agent_port}
ENV COPY_REFERENCE_FILE_LOG $JENKINS_HOME/copy_reference_file.log
ENV JENKINS_UC https://updates.jenkins.io
ENV JENKINS_UC_EXPERIMENTAL=https://updates.jenkins.io/experimental

ENV JAVA_OPTS=\
"-Djava.awt.headless=true "\
"-Djenkins.model.Jenkins.workspacesDir=${JENKINS_VAR}/jobs/\${ITEM_FULL_NAME}/workspace "\
"-Djenkins.model.Jenkins.buildsDir=${JENKINS_VAR}/jobs/\${ITEM_FULL_NAME}/builds "\
"-Dhudson.triggers.SafeTimerTask.logsTargetDir=$JENKINS_VAR/logs "\
"-Djava.util.logging.config.file=$EVERGREEN_HOME/config/logging.properties "\
"-Djenkins.install.runSetupWizard=false "

ENV JENKINS_OPTS=\
"--webroot=${JENKINS_VAR}/war "\
"--pluginroot=${JENKINS_VAR}/plugins"

RUN mkdir -p /usr/share/jenkins/ref/ && \
    mkdir ${EVERGREEN_HOME} && \
    mkdir ${EVERGREEN_HOME}/jenkins/ && \
    mkdir ${JENKINS_HOME} && \
    mkdir ${JENKINS_VAR} && \
    mkdir ${JENKINS_VAR}/logs

# for main web interface:
EXPOSE ${http_port}
EXPOSE 80
# will be used by attached agents:
EXPOSE ${agent_port}

# Add the system dependencies for running Jenkins effectively
#
# The only dependencies for Jenkins Evergreen are:
#   * supervisor
#   * nodejs
RUN apk add --no-cache git \
                        ca-certificates \
                        openssh-client \
                        unzip \
                        bash \
                        openjdk8 \
                        supervisor \
                        ttf-dejavu \
                        curl \
                        socat \
                        wget \
                        nginx

# Ensure the latest npm is available
RUN npm install npm@latest -g

## the nginx alpine package doesn't make this directory properly
RUN mkdir -p /run/nginx

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
RUN deluser node && \
    addgroup -g ${gid} ${group} && \
    adduser -h "$JENKINS_HOME" -u ${uid} -G ${group} -s /bin/bash -D ${user}


# Ensure that only the right CA root certificates are present on the system
# See JEP-307
COPY scripts/generate-ca-certificates /usr/local/sbin/
RUN /usr/local/sbin/generate-ca-certificates

#######################
## Construct the image
#######################
ENV CASC_JENKINS_CONFIG=$EVERGREEN_HOME/config/as-code/

WORKDIR $EVERGREEN_HOME

RUN time chown -R $user:$group $EVERGREEN_HOME
USER $user

# Even if empty, the file needs to exist as we use at least for now https://github.com/lucagrulla/node-tail
# which immediately crashes if the file is missing, even if we use the `follow` switch
RUN touch ${JENKINS_VAR}/logs/evergreen.log.0

USER root
# The externally sourced jenkins.sh expects jenkins-support to be in
# /usr/local/bin
RUN ln -s /evergreen/scripts/jenkins-support /usr/local/bin

CMD /usr/bin/supervisord -c $EVERGREEN_HOME/config/supervisord.conf
