PATH:=./node_modules/.bin:../tools:$(PATH)
COMPOSE:=../tools/compose
IMAGE_NAME:=jenkinsciinfra/evergreen-backend
IMAGE_TAG:=$(shell date "+%Y%m%d%H%M")
DB_DUMP=initdb.d/db.sql
ifndef SENTRY_URL
  SENTRY_URL='https://publickey@sentry.io/projectid'
endif

all: check docs container

# Checking to see if the directory exists because npm install updates the
# directory every time it runs, busting the GNU/Make cache causing rebuilds
depends: package.json
	@if [ ! -d node_modules ]; then \
		npm ci; \
	fi;

docs: depends

store-commit:
	git rev-parse HEAD > commit.txt

run: migrate store-commit
	nodemon src/


## VALIDATION TARGETS
##############################################################
check: depends lint migrate store-commit
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

acceptance: generate-ingest
	NODE_ENV=test npm run acceptance

watch:
	NODE_ENV=test jest --bail --watchAll test/
##############################################################
##

## DEBUG TARGETS
##############################################################
debug-unit:
	NODE_ENV=test node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest -i -b --forceExit test/

debug-acceptance:
	NODE_ENV=test node --inspect-brk=0.0.0.0:9229 node_modules/.bin/jest -i -b --forceExit acceptance/

debug-run: migrate store-commit
	node --inspect-brk=0.0.0.0:9229 src/

debug-db:
	$(COMPOSE) run --rm db psql -h db -U postgres -d evergreen_development

debug-test-db:
	$(COMPOSE) run --rm db psql -h db -U postgres -d evergreen_test

##############################################################
##


## DATABASE RELATED TARGETS
##############################################################
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

dump: stop migrate
	$(COMPOSE) run --rm db pg_dump \
		--inserts \
		-h db -U postgres -d evergreen_development > $(DB_DUMP)
	$(MAKE) stop


seed-ingest:
	curl --data-raw '{"commit":"$(shell date)","manifest":$(shell cat ../services/ingest.json)}' \
	-H 'Authorization: the API calls are coming from inside the house' \
	-H 'Content-Type: application/json' \
	http://localhost:3030/update
##############################################################
##


## DOCKER RELATED TARGETS
##############################################################
container: depends Dockerfile store-commit
	docker build -t $(IMAGE_NAME):$(IMAGE_TAG) .
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest
	$(MAKE) container-migration

container-check: container

container-migration: Dockerfile.migrations
	docker build -t $(IMAGE_NAME)-migrations:$(IMAGE_TAG) -f Dockerfile.migrations .

publish: container
	docker push ${IMAGE_NAME}:$(IMAGE_TAG)
	docker push ${IMAGE_NAME}-migrations:$(IMAGE_TAG)
	docker tag $(IMAGE_NAME):$(IMAGE_TAG) $(IMAGE_NAME):latest
	docker push $(IMAGE_NAME):latest
##############################################################
##


## ESSENTIALS.YAML MANAGEMENT TARGETS
##############################################################
update-center.json:
	wget -O update-center.json https://updates.jenkins.io/update-center.actual.json

update-center-experimental.json:
	wget -O update-center-experimental.json https://updates.jenkins.io/experimental/update-center.actual.json

propose-updates: update-center.json
	node ./prepare-essentials propose-updates --uc ./update-center.json

propose-experimental-updates: update-center-experimental.json
	node ./prepare-essentials propose-updates --uc ./update-center-experimental.json

generate-essentials: essentials.yaml prepare-essentials update-center.json
	node ./prepare-essentials save

generate-ingest: essentials.yaml prepare-essentials
	node ./prepare-essentials generate-ingest
##############################################################
##


## CLEANUP TARGETS
##############################################################
stop:
	$(COMPOSE) stop

clean:
	$(COMPOSE) down || true
	rm -rf node_modules
	rm -f $(DB_DUMP)
	rm -f update-center.json
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true
##############################################################
##


.PHONY: all check clean container depends migrate unit acceptance run run-detach \
	dump debug-unit debug-run debug-acceptance \
	generate-ingest generate-essentials publish
