# Clever: https://stackoverflow.com/a/324782
NODE:=$(shell dirname $(realpath $(lastword $(MAKEFILE_LIST))))/tools/node

all:: check

lint:: depends
	$(NODE) npm run eslint

fix-formatting: depends
	$(NODE) npm run eslint -- --fix

check:: lint
	$(MAKE) unit

unit:: depends
	if [ -z "$${SKIP_TESTS}" ]; then $(NODE) npm run test; \
	else echo "Tests are skipped!"; fi;

debug-unit: depends
	$(NODE) node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest --runInBand --bail --forceExit test/

depends: node_modules

node_modules: package-lock.json package.json
	# Checking to see if the directory exists because npm install updates the
	# directory every time it runs, busting the GNU/Make cache causing rebuilds
	if [ ! -d node_modules ]; then $(NODE) npm ci; fi;

clean::
	rm -rf vendor node_modules build

.PHONY: all check clean depends run unit lint
