NODE:=../tools/node

all: check

check: depends
	$(NODE) npm test

depends: package.json

run:

clean:
	rm -rf vendor/


.PHONY: all check clean container depends
