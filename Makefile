JENKINS_CONTAINER:=jenkins/evergreen

all: check

check: container
	$(MAKE) -C client $@
	$(MAKE) -C services $@

container: Dockerfile.jenkins supervisord.conf
	docker build -f Dockerfile.jenkins \
		-t ${JENKINS_CONTAINER}:latest .

clean:
	docker rmi $(shell docker images -q -f "reference=$(IMAGE_NAME)") || true
	$(MAKE) -C client $@
	$(MAKE) -C services $@

.PHONY: all check clean container
