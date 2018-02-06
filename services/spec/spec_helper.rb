require 'rspec'

$LOAD_PATH << File.expand_path(File.dirname(__FILE__) + '/../')

ENV['RACK_ENV'] = 'test'
ENV['ASSETS_ENDPOINT'] = '/assets'

RSpec.configure do |c|
  c.order = :random
end
