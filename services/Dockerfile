FROM ruby:2.3-alpine as builder

ARG APP_DIR=/srv/evergreen
ARG BUILD_PKGS="ruby-dev openssl-dev gcc make libc-dev binutils g++"

ENV GEM_HOME=${APP_DIR}/vendor/gems
ENV BUNDLE_PATH=${APP_DIR}/vendor/gems
ENV BUNDLE_APP_CONFIG=${APP_DIR}/vendor/gems/.bundle
ENV BUNDLE_DISABLE_SHARED_GEMS=true

RUN mkdir -p ${APP_DIR}/vendor

WORKDIR ${APP_DIR}

ADD Gemfile* ${APP_DIR}/

RUN apk add -U ${BUILD_PKGS} && \
        bundle install --path vendor && \
        apk del ${BUILD_PKGS} && \
        rm -rf /var/cache/apk/*

# Doing a multi-stage build to reset some stuff for a smaller image
FROM ruby:2.3-alpine

# Needed for eventmachine at runtime =_=
RUN apk -U add libstdc++

ARG APP_DIR=/srv/evergreen
WORKDIR ${APP_DIR}

COPY --from=builder ${APP_DIR} .

ENV GEM_HOME=${APP_DIR}/vendor/gems
ENV BUNDLE_PATH=${APP_DIR}/vendor/gems
ENV BUNDLE_APP_CONFIG=${APP_DIR}/vendor/gems/.bundle
ENV BUNDLE_DISABLE_SHARED_GEMS=true

COPY config.ru ${APP_DIR}/
COPY app ${APP_DIR}/app

EXPOSE 9292

CMD bundle exec rackup -s thin -o '0.0.0.0'
