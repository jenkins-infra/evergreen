require 'concurrent/array'
require 'sinatra/base'
require 'sinatra/json'
require 'thread'


module Pusher
  class InProcessQueue < Queue
  end

  class Connection
    attr_reader :id, :stream

    def initialize(identifier, stream)
      @id = identifier
      @stream = stream
    end

    def closed?
      return true if stream.nil?
      return stream.closed?
    end

    def write(buffer)
      return false if closed?
      stream << buffer
    end
  end

  Q     = InProcessQueue.new
  CONNS = Concurrent::Array.new

  PROXY = Thread.new do |t|
    while item = Q.pop
      CONNS.each do |c|
        next if c.closed?
        puts "Sending #{item} to conn #{c}"

        if item[:id]
          c.write("id: #{item[:id]}\n")
        end

        if item[:event]
          c.write("event: #{item[:event]}\n")
        end

        c.write("data: #{item[:data]}\n\n")
      end
    end
  end

  class App < Sinatra::Base
    set :show_exceptions => true
    set :show_exceptions => true
    set :views, File.expand_path(File.dirname(__FILE__) + '/../views/pusher/')
    set :haml, :format => :html5

    get '/health' do
      content_type :json
      response = {
        :status => :ok,
      }
      json response
    end

    get '/' do
      haml :index, :locals => {
        :connections => CONNS
      }
    end

    get '/stream/:ident', :provides => 'text/event-stream' do |ident|
      stream(:keep_open) do |conn|
        puts "Received conn: #{conn}"
        CONNS.reject! { |c| c.closed? }
        CONNS << Connection.new(ident, conn)
      end
    end
  end
end
