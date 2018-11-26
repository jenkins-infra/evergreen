ROOT_DIR="$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))/../"
IMAGE_NAME:=jenkins/evergreen
COMPOSE:=$(ROOT_DIR)/tools/compose
DOWNLOAD=curl -sSL
# This variable is used for downloading some of the "upstream" maintained
# scripts necessary for running Jenkins nicely inside of Docker
SCRIPTS_URL=https://raw.githubusercontent.com/jenkinsci/docker/master
SQUID_VOLUME_NAME=squid-cache

DIST_DIR=build/evergreen

### Phony targets
#################
all: check container

lint: shunit2
	$(ROOT_DIR)/tools/yamllint -s docker-compose*.yml
	$(ROOT_DIR)/tools/yamllint -s ./tests/flavors/*/docker-compose*.yml
	$(ROOT_DIR)/tools/yamllint -s config/as-code/*.yaml
	$(ROOT_DIR)/tools/shellcheck -x tests/*.sh
	$(ROOT_DIR)/tools/jsonlint --quiet ./tests/rollback/*.json
	$(ROOT_DIR)/tools/shellcheck -x scripts/*.sh
	$(MAKE) -C flavors lint
	$(MAKE) -C client lint

check: lint
	$(MAKE) -C client $@
	$(MAKE) container-check


store-commit:
	git rev-parse HEAD > commit.txt

## Distribution
distribution: build/evergreen.zip build/evergreen-docker-cloud.zip build/evergreen-aws-ec2-cloud.zip build/evergreen-java11-docker-cloud.zip

prepare-distribution: build/jenkins-support build/jenkins.sh
	$(MAKE) -C client compile
	mkdir -p $(DIST_DIR)/client $(DIST_DIR)/config $(DIST_DIR)/www $(DIST_DIR)/scripts
	rsync -avm --delete --files-from=packaging-list.client.txt . $(DIST_DIR)/
	rsync -avm --delete --include-from=packaging-list.config.txt --exclude="*" ./config/ $(DIST_DIR)/config
	rsync -avm --delete --include-from=packaging-list.www.txt --exclude="*" ./client/public/ $(DIST_DIR)/www
	# Incorporate our local and downloaded scripts
	rsync -avm --delete --include-from=packaging-list.scripts.txt --exclude="*" ./scripts/ $(DIST_DIR)/scripts
	rsync -avm --include-from=packaging-list.scripts.txt --exclude="*" ./build/ $(DIST_DIR)/scripts

	# Once the tree has been put into place, node_modules must be generated for
	# the distribution
	(cd $(DIST_DIR)/client && $(ROOT_DIR)/tools/npm ci --production)

prepare-docker-cloud-distribution: prepare-distribution
	mkdir -p build/evergreen-docker-cloud/evergreen
	rsync -avm --delete flavors/docker-cloud/config ./build/evergreen-docker-cloud/evergreen

prepare-aws-ec2-cloud-distribution:
	mkdir -p build/evergreen-aws-ec2-cloud/evergreen
	rsync -avm --delete flavors/aws-ec2-cloud/config ./build/evergreen-aws-ec2-cloud/evergreen

prepare-java11-docker-cloud-distribution: build/jenkins-jdk11.sh prepare-distribution
	rsync -avm ./build/jenkins-jdk11.sh $(DIST_DIR)/scripts
	mkdir -p build/evergreen-java11-docker-cloud/evergreen
	rsync -avm --delete flavors/java11-docker-cloud/config ./build/evergreen-java11-docker-cloud/evergreen

build/evergreen-aws-ec2-cloud.zip: prepare-aws-ec2-cloud-distribution
	(cd build && \
		zip -q -r evergreen-aws-ec2-cloud.zip evergreen && \
		cd evergreen-aws-ec2-cloud && \
		zip -q -r ../evergreen-aws-ec2-cloud.zip ./evergreen)

build/evergreen-docker-cloud.zip: prepare-docker-cloud-distribution
	(cd build && \
		zip -q -r evergreen-docker-cloud.zip evergreen && \
		cd evergreen-docker-cloud && \
		zip -q -r ../evergreen-docker-cloud.zip ./evergreen)

build/evergreen-java11-docker-cloud.zip: prepare-java11-docker-cloud-distribution
	(cd build && \
		zip -q -r evergreen-java11-docker-cloud.zip evergreen && \
		cd evergreen-java11-docker-cloud && \
		zip -q -r ../evergreen-java11-docker-cloud.zip ./evergreen)

build/evergreen.zip: prepare-distribution
	(cd build && \
		zip -q -r evergreen.zip evergreen)
############################


fix-formatting:
	$(MAKE) -C client $@

container-prereqs: distribution store-commit

container-check-prereqs: shunit2 ./tests/tests.sh ./tests/offline-tests.sh create-squid-cache-volume
	$(MAKE) -C client lint
	$(MAKE) -C ../services lint
	$(MAKE) -C ../services dump generate-ingest

container-check: docker-cloud-container-check aws-cloud-container-check java11-docker-cloud-container-check rollback-check

# Only checking it on docker-cloud.
rollback-check: containers container-check-prereqs
	FLAVOR=docker-cloud ./tests/rollback-tests.sh

docker-cloud-container-check: containers container-check-prereqs
	FLAVOR=docker-cloud ./tests/offline-tests.sh
	FLAVOR=docker-cloud ./tests/tests.sh

aws-cloud-container-check: containers container-check-prereqs
	FLAVOR=aws-ec2-cloud ./tests/offline-tests.sh
	FLAVOR=aws-ec2-cloud ./tests/tests.sh

java11-docker-cloud-container-check: containers container-check-prereqs
	FLAVOR=java11-docker-cloud ./tests/offline-tests.sh
	FLAVOR=java11-docker-cloud ./tests/tests.sh

container: container-prereqs Dockerfile config/supervisord.conf
	$(MAKE) -C client build
	docker build -t ${IMAGE_NAME}:base .
	$(MAKE) -C flavors $@

containers: container
	$(MAKE) -C ../services container

publish: container
	$(MAKE) -C flavors $@

create-squid-cache-volume:
	docker volume create ${SQUID_VOLUME_NAME}

run: create-squid-cache-volume container-check-prereqs
	$(COMPOSE) -f docker-compose.yml \
             -f docker-compose.squid-cache.yml \
             -f tests/flavors/docker-cloud/docker-compose.docker-cloud.yml \
             up


clean:
	$(COMPOSE) down || true
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true
	$(MAKE) -C client $@
	rm -f build/docker-compose
	docker volume rm ${SQUID_VOLUME_NAME} || echo "Volume already removed?"
	rm -rf build/

#################

build:
	mkdir -p build

build/jenkins-jdk11.sh: build
	$(DOWNLOAD) $(SCRIPTS_URL)/jenkins-jdk11.sh > $@
	chmod +x $@

build/jenkins.sh: build
	$(DOWNLOAD)  $(SCRIPTS_URL)/jenkins.sh > $@
	chmod +x $@

build/jenkins-support: build
	$(DOWNLOAD) $(SCRIPTS_URL)/jenkins-support > $@
	chmod +x $@

shunit2:
	git clone --depth 1 https://github.com/kward/shunit2

.PHONY: all check clean container container-check container-prereqs \
	container-check-prereqs \
	docker-cloud-container-check create-squid-cache-volume \
	distribution prepare-distribution
