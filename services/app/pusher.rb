require 'concurrent/array'
require 'sinatra/base'
require 'sinatra/json'

module Pusher
  class App < Sinatra::Base
    set :connections => Concurrent::Array.new
    set :show_exceptions => true

    get '/health' do
      content_type :json
      response = {
        :status => :ok,
      }
      json response
    end

    get '/', :provides => 'text/event-stream' do
      stream(:keep_open) do |conn|
        puts "Received conn: #{conn}"
        settings.connections.reject! do |c|
          puts "rejecting #{c}" if c.closed?
          c.closed?
        end
        settings.connections << conn
      end
    end
  end
end
