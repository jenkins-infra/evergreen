FROM jenkins/evergreen

ARG FLAVOR=null
ENV FLAVOR ${FLAVOR}

COPY config/as-code/* /usr/share/jenkins/ref/configuration/
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
