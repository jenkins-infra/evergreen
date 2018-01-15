require 'sinatra/base'

module Updatesrv
  class App < Sinatra::Base
    get '/' do
      'Evergreen Update Service'
    end
  end
end
