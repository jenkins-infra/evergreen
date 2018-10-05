include ../../node.mk

PATH:=./node_modules/.bin:../../tools:$(PATH)

all:: build

lint:: compile

check:: compile

compile:
	tsc

docs:
	rsync -avz --exclude=developer ../../docs .
	node ./scripts/render-docs

build: depends docs compile
	webpack-cli

watch-compile:
	tsc -w

run: depends build
	EVERGREEN_HOME=/tmp/ \
		EVERGREEN_DATA=/tmp/ \
		EVERGREEN_DISABLE_SNAPSHOT=true \
		EVERGREEN_ENDPOINT=http://127.0.0.1:3030 \
		FLAVOR=docker-cloud \
		npm run client

.PHONY: run build docs compile
