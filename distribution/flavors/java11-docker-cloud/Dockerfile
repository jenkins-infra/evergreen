FROM node:10

ARG user=jenkins
ARG group=jenkins
ARG uid=1000
ARG gid=1000
ARG http_port=8080
ARG agent_port=50000

ENV EVERGREEN_ENDPOINT=https://evergreen.jenkins.io/
ENV EVERGREEN_HOME /evergreen
ENV EVERGREEN_DATA /evergreen/data

ENV JENKINS_HOME ${EVERGREEN_DATA}/jenkins/home
ENV JENKINS_WAR ${JENKINS_HOME}/jenkins.war
ENV JENKINS_VAR ${EVERGREEN_DATA}/jenkins/var
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
"-Dhudson.udp=-1 "\
"-Dhudson.DNSMultiCast.disabled=true "\
"-Djenkins.install.runSetupWizard=false "

ENV JENKINS_OPTS=\
"--webroot=${JENKINS_VAR}/war "\
"--pluginroot=${JENKINS_VAR}/plugins"

RUN mkdir -p /usr/share/jenkins/ref/ && \
    mkdir -p ${EVERGREEN_HOME} && \
    mkdir -p ${EVERGREEN_DATA}/jenkins/ && \
    mkdir -p ${JENKINS_HOME} && \
    mkdir -p ${JENKINS_VAR} && \
    mkdir -p ${JENKINS_VAR}/logs

# for main web interface:
EXPOSE 80
# will be used by attached agents:
EXPOSE ${agent_port}

# Add the system dependencies for running Jenkins effectively
#
# The only dependencies for Jenkins Evergreen are:
#   * supervisor
#   * nodejs
RUN apt-get update -y &&\
    apt-get install -y git \
    ca-certificates \
    openssh-client \
    unzip \
    bash \
    supervisor \
    ttf-dejavu \
    curl \
    socat \
    time \
    nginx

# Ensure the latest npm is available
RUN npm install npm@latest -g

## the nginx alpine package doesn't make this directory properly
RUN mkdir -p /run/nginx

RUN cd /tmp && \
    curl -sL https://download.docker.com/linux/static/stable/x86_64/docker-17.12.1-ce.tgz --output /tmp/docker.tar.gz && \
    echo "9dd0d19312640460671352930eb44b1692441d95  docker.tar.gz" | sha1sum -c && \
    tar xzf docker.tar.gz && \
    mv docker/* /usr/local/bin && \
    rmdir docker && \
    rm docker.tar.gz

# Jenkins is run with user `jenkins`, uid = 1000
# If you bind mount a volume from the host or a data container,
# ensure you use the same uid
RUN userdel node && \
    addgroup --gid ${gid} ${group} && \
    useradd -d "$JENKINS_HOME" -u ${uid} -g ${gid} -m -s /bin/bash ${user}

COPY commit.txt /

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

# This is just a place holder entrypoint and is expected to be overridden by
# the flavor specific images
CMD nginx -g "daemon off;"

RUN mkdir /usr/java && \
    curl -LS https://github.com/AdoptOpenJDK/openjdk11-binaries/releases/download/jdk-11.0.1%2B13/OpenJDK11-jdk_x64_linux_openj9_11.0.1_13.tar.gz | \
    tar xzf - -C /usr/java && \
    mv /usr/java/jdk*/* /usr/java && \
    rmdir /usr/java/jdk*
ENV PATH=$PATH:/usr/java/bin
