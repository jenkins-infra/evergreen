NODE:=../tools/node
IMAGE_NAME:=jenkinsciinfra/evergreen

all: check docs container

check: depends
	$(NODE) npm test

depends: package.json
	# Checking to see if the directory exists because npm install updates the
	# directory every time it runs, busting the GNU/Make cache causing rebuilds
	if [ ! -d node_modules ]; then \
		$(NODE) npm install; \
	fi;

docs: depends

run:
	$(NODE) npm run services

container: depends check Dockerfile
	docker build -t $(IMAGE_NAME):latest .

clean:
	rm -rf node_modules
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true

.PHONY: all check clean container depends
