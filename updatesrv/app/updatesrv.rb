require 'sinatra/base'

require 'apps/jenkins'

module Updatesrv
  class App < Sinatra::Base

    before do
      @apps = {}
      @apps[:jenkins] = Apps::Jenkins.new
    end

    get '/' do
      'Evergreen Update Service'
    end

    get '/health' do
      response = { :updatesrv => :ok, :apps => {} }
      @apps.each_pair do |name, app|
        response[:apps][name] = app.last_refreshed?
      end
      response.to_json
    end
  end
end
