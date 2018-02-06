require 'concurrent/hash'
require 'sinatra/base'
require 'sinatra/json'
require 'thread'


module Pusher
  class InProcessQueue < Queue
  end
  class Message
    attr_accessor :id, :event, :data

    def empty?
      return data.nil?
    end
  end

  class Connection
    attr_reader :id, :stream

    def initialize(identifier, stream)
      @id = identifier
      @stream = stream
      @last_connected = Time.now.utc
    end

    def closed?
      return true if stream.nil?
      return stream.closed?
    end

    # Only meant to be used when a Connection which already exists
    # reconnects
    def stream=(new_stream)
      @stream = new_stream
      connected!
    end

    def write(buffer)
      return false if closed?
      stream << buffer
    end

    def last_connected_at?
      return @last_connected
    end

    def connected!
      @last_connected = Time.now.utc
    end

    def send(message)
      return false unless message.kind_of? Pusher::Message
      return false if message.empty?

      if message.id
        write("id: #{message.id}\n")
      end

      if message.event
        write("event: #{message.event}\n")
      end

      write("data: #{message.data}\n\n")
      return true
    end

    def to_json(*a)
      return {
        :id => id,
        :closed => closed?,
        :last_connected => @last_connected.iso8601,
      }.to_json(a)
    end
  end

  Q     = InProcessQueue.new
  CONNS = Concurrent::Hash.new

  PROXY = Thread.new do |t|
    while item = Q.pop
      CONNS.each_value do |c|
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
    set :views, File.expand_path(File.dirname(__FILE__) + '/../views/pusher/')
    set :haml, :format => :html5

    # TODO: require API token
    get '/health' do
      content_type :json
      json({
        :data => {
        },
        :meta => {
        },
      })
    end

    get '/' do
      haml :index, :locals => {
        :connections => CONNS
      }
    end

    # TODO: require API token
    get '/connections' do
      content_type :json

      json({
        :data => CONNS,
        :meta => {
        },
      })
    end

    # TODO: requires API token
    post '/ping/:ident' do |ident|
      halt 404 unless CONNS.has_key? ident
      message = Message.new
      message.event = :ping
      message.data = Time.now.utc.iso8601

      if CONNS[ident].send(message)
        redirect back
      else
        status 400
        'Failed to send'
      end
    end

    post '/pong/:ident' do |ident|
      puts CONNS
      halt 404 unless CONNS.has_key? ident
      connection = CONNS[ident]
      connection.connected!
    end

    get '/stream/:ident', :provides => 'text/event-stream' do |ident|
      stream(:keep_open) do |conn|
        if CONNS.has_key? ident
          CONNS[ident].stream = conn
        else
          # Flush out old connections. As the connection list grows, this will
          # likely need to be something handled in a separate thread or process
          CONNS.reject! { |k, c| c.closed? }
          CONNS[ident] = Connection.new(ident, conn)
        end
      end
    end
  end
end
