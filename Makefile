JENKINS_CONTAINER:=jenkins/evergreen
RUBY=./tools/ruby
# This variable is used for downloading some of the "upstream" maintained
# scripts necessary for running Jenkins nicely inside of Docker
SCRIPTS_URL=https://raw.githubusercontent.com/jenkinsci/docker/master/

### Phony targets
#################
all: check container

check:
	$(MAKE) -C client $@
	$(MAKE) -C services $@

container-prereqs: build/jenkins-support build/jenkins.sh

container: container-prereqs Dockerfile supervisord.conf fetch-versions
	docker build -t ${JENKINS_CONTAINER}:latest .

fetch-versions: essentials.yaml update-essentials update-center.json
	$(RUBY) ./update-essentials essentials.yaml update-center.json

clean:
	docker rmi $(shell docker images -q -f "reference=$(IMAGE_NAME)") || true
	rm -f update-center.json
	$(MAKE) -C client $@
	$(MAKE) -C services $@
#################


update-center.json:
	curl -sSL https://updates.jenkins.io/current/update-center.actual.json > update-center.json

build/jenkins.sh:
	mkdir -p build
	curl -sSL $(SCRIPTS_URL)/jenkins.sh > $@
	chmod +x $@

build/jenkins-support:
	mkdir -p build
	curl -sSL $(SCRIPTS_URL)/jenkins-support > $@
	chmod +x $@

.PHONY: all check clean container container-prereqs fetch-versions
