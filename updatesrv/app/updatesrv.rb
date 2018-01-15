require 'sinatra/base'

module Updatesrv
  class App < Sinatra::Base
    get '/' do
      'Evergreen Update Service'
    end

    get '/health' do
      {
        :updatesrv => :ok,
        :apps      => [
        ],
      }.to_json
    end
  end
end
