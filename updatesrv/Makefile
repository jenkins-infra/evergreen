RUBY:=../tools/ruby

all: check docs

check: depends
	$(RUBY) bundle exec rspec -t ~type:integration
	$(RUBY) bundle exec rspec -t type:integration

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

run:
	PORTS="-p 9292:9292" $(RUBY) bundle exec puma -t 1 -b tcp://0.0.0.0:9292

clean:
	rm -rf vendor/


.PHONY: all check clean depends
