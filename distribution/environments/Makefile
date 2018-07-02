IMAGE_NAME:=jenkins/evergreen

container:
	./build-or-push-flavors.sh build

publish: container
	./build-or-push-flavors.sh push
