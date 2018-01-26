require 'spec_helper'
require 'rack/test'

require 'app/pusher'

describe Pusher::App do
  include Rack::Test::Methods

  def app
    return subject
  end

  it 'should have a /health endpoint' do
    get '/health'
    expect(last_response).to be_ok
  end
end
