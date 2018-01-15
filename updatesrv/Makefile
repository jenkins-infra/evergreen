RUBY:=../tools/ruby

all: check docs

check: depends
	$(RUBY) bundle exec rspec -t ~type:integration
	$(RUBY) bundle exec rspec -t type:integration

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

clean:
	rm -rf vendor/


.PHONY: all check clean depends
