JENKINS_CONTAINER:=jenkins/evergreen
RUBY=./tools/ruby

all: check container

check:
	$(MAKE) -C client $@
	$(MAKE) -C services $@

container: Dockerfile.jenkins supervisord.conf fetch-versions
	docker build -f Dockerfile.jenkins \
		-t ${JENKINS_CONTAINER}:latest .

fetch-versions: essentials.yaml update-essentials update-center.json
	$(RUBY) ./update-essentials essentials.yaml update-center.json

update-center.json:
	curl -sSL https://updates.jenkins.io/current/update-center.actual.json > update-center.json

clean:
	docker rmi $(shell docker images -q -f "reference=$(IMAGE_NAME)") || true
	rm -f update-center.json
	$(MAKE) -C client $@
	$(MAKE) -C services $@

.PHONY: all check clean container
