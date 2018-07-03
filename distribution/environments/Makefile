IMAGE_NAME:=jenkins/evergreen

container:
	./build-or-push-flavors.sh build

publish: container
	./build-or-push-flavors.sh push

lint:
	../../tools/shellcheck *.sh
	../../tools/jsonlint --quiet ./aws-ec2-cloud/CloudFormation/cloudformation-template.json
	../../tools/yamllint --strict */config/as-code/*.yaml

.PHONY: container publish lint
