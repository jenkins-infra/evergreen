NODE:=../../tools/node

all: check

lint: depends
	$(NODE) npm run eslint

fix-formatting: depends
	$(NODE) npm run eslint -- --fix

check: lint
	$(MAKE) unit

unit: depends
	if [ -z "$${SKIP_TESTS}" ]; then \
		$(NODE) npm run jest; \
	fi;

debug-unit: depends
	$(NODE) node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest --runInBand --bail --forceExit test/

depends: node_modules

node_modules: package-lock.json package.json
	# Checking to see if the directory exists because npm install updates the
	# directory every time it runs, busting the GNU/Make cache causing rebuilds
	if [ ! -d node_modules ]; then \
		$(NODE) npm install; \
	fi;

run: depends run-services
	EVERGREEN_HOME=/tmp/evergreen-home \
		EVERGREEN_ENDPOINT=http://127.0.0.1:3030 \
		$(NODE) npm run client

run-services:
	$(MAKE) -C ../services run-detach

clean:
	rm -rf vendor/
	rm -rf node_modules/

.PHONY: all check clean container depends run run-services \
	unit lint
