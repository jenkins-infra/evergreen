JENKINS_CONTAINER:=jenkins/evergreen

all: check

check: Dockerfile
	docker build -t ${JENKINS_CONTAINER}:latest .

clean:
	docker rmi $(shell docker images -q -f "reference=$(IMAGE_NAME)") || true


.PHONY: all check clean
