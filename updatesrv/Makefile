RUBY:=../tools/ruby

all: check

check: depends
	$(RUBY) bundle exec rspec


depends: Gemfile
	$(RUBY) bundle install

clean:


.PHONY: all check clean depends
