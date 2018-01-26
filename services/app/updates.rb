require 'concurrent/array'
require 'hashie'
require 'sinatra/base'
require 'sinatra/json'
require 'thread'

require 'app/pusher'
require 'app/updates/jenkins'

module Updates
  class App < Sinatra::Base
    set :connections => Concurrent::Array.new
    set :show_exceptions => true

    before do
      if Thread.current[:apps].nil?
        Thread.current[:apps] = {
          :jenkins => Updates::Jenkins.new
        }
      end
      @apps = Thread.current[:apps]
    end

    get '/restart' do
      content_type :json
      payload = {
        :data => Time.now.utc.iso8601,
        :event => 'restart'
      }
      Pusher::Q.push(payload)
      json payload
    end

    get '/' do
      'Evergreen Update Service'
    end

    get '/health' do
      content_type :json
      response = { :status => :ok }
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
