include ../../node.mk

run: depends
	EVERGREEN_HOME=/tmp/ \
		EVERGREEN_ENDPOINT=http://127.0.0.1:3030 \
		FLAVOR=docker-cloud \
		$(NODE) npm run client

.PHONY: run
