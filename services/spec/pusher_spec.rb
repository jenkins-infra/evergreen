require 'spec_helper'
require 'rack/test'

require 'app/pusher'

describe Pusher::App do
  include Rack::Test::Methods

  def app
    return subject
  end

  let(:json) { JSON.load(last_response.body) }

  it 'should have a /health endpoint' do
    get '/health'
    expect(last_response).to be_ok
  end

  it 'should have a /connections endpoint' do
    get '/connections'
    expect(last_response).to be_ok

    # We're not expecting to have any
    expect(json['data']).to be_empty
  end
end
