require 'spec_helper'
require 'rack/test'

require 'updatesrv'

describe Updatesrv::App do
  include Rack::Test::Methods

  def app
    return subject
  end

  it 'should have a root handler' do
    get '/'

    expect(last_response).to be_ok
  end
end
