IMAGE_NAME:=jenkins/evergreen
DOCKERCLOUD_TAGNAME:=docker-cloud

container: docker-cloud/Dockerfile
	cd docker-cloud && docker build -t ${IMAGE_NAME}:${DOCKERCLOUD_TAGNAME} .
