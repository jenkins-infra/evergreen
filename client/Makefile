NODE:=../tools/node

all: check

check: depends
	$(NODE) npm test

depends: package-lock.json

package-lock.json: package.json
	$(NODE) npm install

run:
	$(NODE) npm run client

clean:
	rm -rf vendor/


.PHONY: all check clean container depends
