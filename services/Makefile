RUBY:=../tools/ruby
IMAGE_NAME:=jenkinsciinfra/evergreen

all: check docs container

check: depends essentials.yaml
	# First run all the non-integration tests (speed)
	$(RUBY) bundle exec rspec -t ~type:integration
	# Then run all the slower integration tests
	$(RUBY) bundle exec rspec -t type:integration

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

run: essentials.yaml
	PORTS="-p 9292:9292" $(RUBY) bundle exec rackup -s thin -o 0.0.0.0 -p 9292

update: Gemfile
	$(RUBY) bundle update

container: depends check Dockerfile
	docker build -t $(IMAGE_NAME):latest .

essentials.yaml:
	cp ../essentials.yaml .

clean:
	rm -rf vendor/
	rm -f essentials.yaml
	docker rmi $$(docker images -q -f "reference=$(IMAGE_NAME)") || true

.PHONY: all check clean container depends update
