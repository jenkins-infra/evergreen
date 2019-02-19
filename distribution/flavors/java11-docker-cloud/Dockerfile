FROM jenkins/evergreen:docker-cloud

ARG FLAVOR=null
ENV FLAVOR ${FLAVOR}

# Prepare the flavor specific parts of the distribution
# https://github.com/moby/moby/issues/35018, cannot use $user below
COPY --chown=jenkins:jenkins build/evergreen-${FLAVOR}.zip /
RUN cd / && unzip -qo evergreen-${FLAVOR}.zip && chown -R jenkins:jenkins /evergreen
RUN rm -f /evergreen-${FLAVOR}.zip

RUN curl -L --show-error https://download.java.net/java/GA/jdk11/13/GPL/openjdk-11.0.1_linux-x64_bin.tar.gz --output openjdk.tar.gz && \
    echo "7a6bb980b9c91c478421f865087ad2d69086a0583aeeb9e69204785e8e97dcfd  openjdk.tar.gz" | sha256sum -c && \
    tar xvzf openjdk.tar.gz && \
    mv jdk-11.0.1/ /usr/java && \
    rm openjdk.tar.gz
ENV PATH=/usr/java/bin:$PATH
