FROM jenkins/jenkins:alpine

USER root

# Add the system dependencies for running a basic Jenkins Evergreen instance
RUN apk add --no-cache \
        supervisor

#RUN  mkdir -p /usr/share/jenkins && \
#            curl -sSL https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war  > /usr/share/jenkins/jenkins.war

ENV EVERGREEN_UPDATESRV=http://127.0.0.1:9292

COPY prepare-manifest /usr/share/jenkins
COPY perform-updates /usr/share/jenkins
COPY start-jenkins /usr/share/jenkins
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
CMD /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
