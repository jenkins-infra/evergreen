RUBY:=../tools/ruby
IMAGE_NAME:=rtyler/evergreen-updatesrv

all: check docs container

check: depends
	# First run all the non-integration tests (speed)
	$(RUBY) bundle exec rspec -t ~type:integration
	# Then run all the slower integration tests
	$(RUBY) bundle exec rspec -t type:integration

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

run:
	cp ../essentials.yaml .
	PORTS="-p 9292:9292" $(RUBY) bundle exec rackup -s thin -o 0.0.0.0 -p 9292

container: depends check Dockerfile
	docker build -t $(IMAGE_NAME):latest .

clean:
	rm -rf vendor/


.PHONY: all check clean container depends
