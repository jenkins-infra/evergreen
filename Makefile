JENKINS_CONTAINER:=jenkins/evergreen
RUBY=./tools/ruby
# This variable is used for downloading some of the "upstream" maintained
# scripts necessary for running Jenkins nicely inside of Docker
SCRIPTS_URL=https://raw.githubusercontent.com/jenkinsci/docker/master/

### Phony targets
#################
all: check container

lint: essentials.yaml shunit2
	./tools/yamllint -s ./essentials.yaml
	./tools/shellcheck -x tests/tests.sh
	./tools/shellcheck -x scripts/shim-startup-wrapper.sh

check: lint
	$(MAKE) -C client $@
	$(MAKE) -C services $@
	$(MAKE) container-check

container-prereqs: build/jenkins-support build/jenkins.sh build/install-plugins.sh scripts/shim-startup-wrapper.sh build/configuration-as-code/target/configuration-as-code.hpi

container-check: shunit2 ./tests/tests.sh container
	./tests/tests.sh

container: container-prereqs Dockerfile supervisord.conf
	docker build -t ${JENKINS_CONTAINER}:latest .

publish: container
	docker push ${JENKINS_CONTAINER}:latest

clean:
	docker rmi $(shell docker images -q -f "reference=$(IMAGE_NAME)") || true
	rm -f update-center.json
	$(MAKE) -C client $@
	$(MAKE) -C services $@
	rm -rf build/configuration-as-code/target

#################

build/jenkins.sh:
	mkdir -p build
	curl -sSL $(SCRIPTS_URL)/jenkins.sh > $@
	chmod +x $@

build/jenkins-support:
	mkdir -p build
	curl -sSL $(SCRIPTS_URL)/jenkins-support > $@
	chmod +x $@

build/install-plugins.sh:
	mkdir -p build
	curl -sSL $(SCRIPTS_URL)/install-plugins.sh > $@
	chmod +x $@

build/configuration-as-code:
	git clone https://github.com/jenkinsci/configuration-as-code-plugin.git build/configuration-as-code

build/configuration-as-code/target/configuration-as-code.hpi: build/configuration-as-code
	./tools/mvn --file build/configuration-as-code clean package -DskipTests

shunit2:
	git clone https://github.com/kward/shunit2

.PHONY: all check clean container container-check container-prereqs
