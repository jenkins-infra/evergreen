require 'hashie'
require 'sinatra/base'
require 'sinatra/json'

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
      content_type :json
      response = { :updatesrv => :ok, :apps => {} }
      @apps.each_pair do |name, app|
        response[:apps][name] = app.last_refreshed?
      end
      json response
    end

    post '/check/:app' do |app|
      content_type :json

      if updater = @apps[app.to_sym]
        halt 400 if request.body.size <= 0

        request.body.rewind
        inbound_manifest = JSON.parse(request.body.read)
        Hashie.symbolize_keys! inbound_manifest

        json updater.should_update?(inbound_manifest)
      else
        status 404
      end
    end

    head '/check/:app' do |app|
      content_type :json

      if updater = @apps[app.to_sym]
        status 200
        headers 'Last-Modified' => updater.last_refreshed?
      else
        status 404
      end
    end
  end
end
