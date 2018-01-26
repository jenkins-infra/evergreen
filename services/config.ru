ENV['RACK_ENV'] ||= 'development'

$LOAD_PATH << File.dirname(__FILE__)
$LOAD_PATH << File.expand_path(File.dirname(__FILE__) + '/app/')

require 'updatesrv'

use Rack::Static, :urls => ["/css", "/img", "/js"], :root => "public"
run Updatesrv::App
