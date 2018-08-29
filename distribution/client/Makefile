include ../../node.mk

PATH:=./node_modules/.bin:../../tools:$(PATH)

build: depends
	node ./scripts/render-docs
	webpack-cli

run: depends build
	EVERGREEN_HOME=/tmp/ \
		EVERGREEN_ENDPOINT=http://127.0.0.1:3030 \
		FLAVOR=docker-cloud \
		npm run client

.PHONY: run
