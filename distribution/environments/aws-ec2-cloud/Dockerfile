FROM jenkins/evergreen

COPY config/as-code/* /usr/share/jenkins/ref/configuration/

# Need to override the default certificates to add the ones for EC2 and S3 auto-detection
# See specific comments in the script
COPY scripts/generate-ca-certificates /usr/local/sbin/
RUN /usr/local/sbin/generate-ca-certificates
