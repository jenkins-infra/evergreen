JENKINS_CONTAINER:=jenkins/evergreen
COMPOSE:=./tools/compose
DOWNLOAD=curl -sSL
# This variable is used for downloading some of the "upstream" maintained
# scripts necessary for running Jenkins nicely inside of Docker
SCRIPTS_URL=https://raw.githubusercontent.com/jenkinsci/docker/master/

### Phony targets
#################
all: check container

lint: essentials.yaml shunit2
	./tools/yamllint -s ./essentials.yaml
	./tools/shellcheck -x tests/tests.sh
	./tools/shellcheck -x scripts/*.sh

check: lint
	$(MAKE) -C client $@
	$(MAKE) -C services $@
	$(MAKE) container-check

container-prereqs: build/jenkins-support build/jenkins.sh scripts/shim-startup-wrapper.sh build-plugins

build-plugins:
	./scripts/build-plugins.sh

container-check: shunit2 ./tests/tests.sh container
	./tests/tests.sh

container: container-prereqs Dockerfile supervisord.conf
	docker build -t ${JENKINS_CONTAINER}:latest .

publish: container
	docker push ${JENKINS_CONTAINER}:latest

update-center.json:
	$(DOWNLOAD) https://updates.jenkins.io/current/update-center.actual.json > update-center.json

run: check container
	$(COMPOSE) up

clean:
	$(COMPOSE) down || true
	docker rmi $$(docker images -q -f "reference=$(JENKINS_CONTAINER)") || true
	rm -f update-center.json
	$(MAKE) -C client $@
	$(MAKE) -C services $@
	rm -f build/docker-compose
	rm -rf build/configuration-as-code/target
	rm -rf build/essentials/target

#################

build/jenkins.sh:
	mkdir -p build
	$(DOWNLOAD)  $(SCRIPTS_URL)/jenkins.sh > $@
	chmod +x $@

build/jenkins-support:
	mkdir -p build
	$(DOWNLOAD) $(SCRIPTS_URL)/jenkins-support > $@
	chmod +x $@

shunit2:
	git clone --depth 1 https://github.com/kward/shunit2

.PHONY: all check clean container container-check container-prereqs
