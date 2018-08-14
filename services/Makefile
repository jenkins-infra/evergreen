PATH:=./node_modules/.bin:../tools:$(PATH)
COMPOSE:=../tools/compose
IMAGE_NAME:=jenkinsciinfra/evergreen-backend
IMAGE_TAG:=$(shell date "+%Y%m%d%H%M")
DB_DUMP=initdb.d/db.sql
ifndef SENTRY_URL
  SENTRY_URL='https://publickey@sentry.io/projectid'
endif

all: check docs container

check: depends lint migrate
	if [ -z "$${SKIP_TESTS}" ]; then \
        $(MAKE) unit acceptance; \
	else \
		echo "[Service] Tests are skipped!"; \
	fi;

lint: depends
	../tools/yamllint -s docker-compose*.yml
	../tools/yamllint -s essentials.yaml
	npm run eslint

fix-formatting: depends
	npm run eslint -- --fix

unit: depends
	NODE_ENV=test npm run jest
	NODE_ENV=test node jest -b --coverage=false --forceExit cli-test/

debug-unit:
	NODE_ENV=test node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest -i -b --forceExit test/

acceptance: generate-ingest
	NODE_ENV=test npm run acceptance

debug-acceptance:
	NODE_ENV=test node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest -i -b --forceExit acceptance/

watch:
	NODE_ENV=test jest --bail --watchAll test/


# Checking to see if the directory exists because npm install updates the
# directory every time it runs, busting the GNU/Make cache causing rebuilds
depends: package.json
	@if [ ! -d node_modules ]; then \
		npm install; \
	fi;

docs: depends

migrate: depends
	$(COMPOSE) up -d db
	./scripts/check-psql
	for env in "test" "development"; do \
		echo ">> Preparing $$env database"; \
		$(COMPOSE) run --rm db \
			psql -v ON_ERROR_STOP=1 \
				-U postgres -h db -c "CREATE DATABASE evergreen_test;"; \
		NODE_ENV=$$env sequelize db:migrate; \
		NODE_ENV=$$env sequelize db:seed:all; \
	done;

run: migrate
	npm run start

debug-run:
	node --inspect-brk=0.0.0.0:9229 src/

stop:
	$(COMPOSE) stop

dump: stop migrate
	$(COMPOSE) run --rm db pg_dump \
		--inserts \
		-h db -U postgres -d evergreen_development > $(DB_DUMP)
	$(MAKE) stop

container: depends Dockerfile
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest
	$(MAKE) container-migration

container-check: container

container-migration: Dockerfile.migrations
	docker build -t $(IMAGE_NAME)-migrations:$(IMAGE_TAG) -f Dockerfile.migrations .

generate-essentials: essentials.yaml prepare-essentials
	wget -O update-center.json https://updates.jenkins.io/update-center.actual.json
	node ./prepare-essentials save

generate-ingest: essentials.yaml prepare-essentials
	node ./prepare-essentials generate-ingest

clean:
	$(COMPOSE) down || true
	rm -rf node_modules
	rm -f $(DB_DUMP)
	rm -f update-center.json
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true

publish: container
	docker push ${IMAGE_NAME}:$(IMAGE_TAG)
	docker push ${IMAGE_NAME}-migrations:$(IMAGE_TAG)
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest
	docker push $(IMAGE_NAME):latest

.PHONY: all check clean container depends migrate unit acceptance run run-detach \
	dump debug-unit debug-run debug-acceptance \
	generate-ingest generate-essentials publish
