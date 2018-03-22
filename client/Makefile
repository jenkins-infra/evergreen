NODE:=../tools/node

all: check

check: depends
	$(NODE) npm test

depends: node_modules

node_modules: package-lock.json package.json
	# Checking to see if the directory exists because npm install updates the
	# directory every time it runs, busting the GNU/Make cache causing rebuilds
	if [ ! -d node_modules ]; then \
		$(NODE) npm install; \
	fi;

run:
	$(NODE) npm run client

clean:
	rm -rf vendor/


.PHONY: all check clean container depends
