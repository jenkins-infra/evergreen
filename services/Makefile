RUBY:=../tools/ruby
IMAGE_NAME:=rtyler/evergreen-updatesrv

all: check docs container

check: depends
	$(RUBY) bundle exec rspec -t ~type:integration
	$(RUBY) bundle exec rspec -t type:integration

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

run:
	PORTS="-p 9292:9292" $(RUBY) bundle exec rackup -s thin -o 0.0.0.0 -p 9292

container: depends check Dockerfile
	docker build -t $(IMAGE_NAME):latest .

clean:
	rm -rf vendor/


.PHONY: all check clean container depends
