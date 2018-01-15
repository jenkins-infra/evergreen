FROM jenkins/jenkins:alpine

USER root

# Add the system dependencies for running a basic Jenkins Evergreen instance
RUN apk add --no-cache \
        supervisor \

#RUN  mkdir -p /usr/share/jenkins && \
#            curl -sSL https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war  > /usr/share/jenkins/jenkins.war
