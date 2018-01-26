require 'concurrent/array'
require 'concurrent/hash'
require 'hashie'
require 'sinatra/base'
require 'sinatra/json'
require 'thread'

require 'apps/jenkins'

module Updatesrv
  class App < Sinatra::Base
    set :connections => Concurrent::Array.new

    before do
      if Thread.current[:apps].nil?
        Thread.current[:apps] = {
          :jenkins => Apps::Jenkins.new
        }
      end
      @apps = Thread.current[:apps]
    end

    get '/' do
      settings.connections.each do |conn|
        m = "data: #{Time.now.utc}\n\n"
        puts m
        conn << m
      end

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

    get '/sse', :provides => 'text/event-stream' do
      stream(:keep_open) do |conn|
        puts "Received conn: #{conn}"
        settings.connections.reject! do |c|
          puts "rejecting #{c}" if c.closed?
          c.closed?
        end
        settings.connections << conn
      end
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
