require 'rspec'

$LOAD_PATH << File.expand_path(File.dirname(__FILE__) + '/../app/')

RSpec.configure do |c|
  c.order = :random
end
