require 'rspec'

$LOAD_PATH << File.expand_path(File.dirname(__FILE__) + '/../')

RSpec.configure do |c|
  c.order = :random
end
