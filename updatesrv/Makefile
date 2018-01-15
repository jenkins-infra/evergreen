RUBY:=../tools/ruby

all: check docs

check: depends
	$(RUBY) bundle exec rspec

depends: Gemfile
	$(RUBY) bundle install

docs: depends
	$(RUBY) bundle exec yard

clean:
	rm -rf vendor/


.PHONY: all check clean depends
