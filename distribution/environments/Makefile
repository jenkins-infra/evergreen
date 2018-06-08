JENKINS_CONTAINER:=jenkins/evergreen
DOCKERCLOUD_TAGNAME:=docker-cloud

container: docker-cloud/Dockerfile
	cd docker-cloud && docker build -t ${JENKINS_CONTAINER}:${DOCKERCLOUD_TAGNAME} .
