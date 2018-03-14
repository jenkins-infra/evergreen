ENV['RACK_ENV'] ||= 'development'

$LOAD_PATH << File.dirname(__FILE__)
$LOAD_PATH << File.expand_path(File.dirname(__FILE__) + '/app/')

require 'pusher'

ENV['PUSHER_ENDPOINT'] = '/sse'
ENV['ASSETS_ENDPOINT'] = '/assets'

use Rack::Static, :urls => ['/assets']

map '/sse' do
  run Pusher::App
end
