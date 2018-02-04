require 'spec_helper'
require 'rack/test'
require 'timecop'

require 'app/updates'

describe Updates::App do
  include Rack::Test::Methods

  def app
    return subject
  end

  before { Timecop.freeze }
  after { Timecop.return }

  it 'should have a root handler' do
    get '/'

    expect(last_response).to be_ok
  end

  it 'should have a /health endpoint' do
    get '/health'
    expect(last_response).to be_ok
  end

  context 'checking for updates' do
    context 'HEAD /validate/jenkins' do
      before :each do
        head '/validate/jenkins'
      end

      it 'should set Last-Modified to now by default' do
        expect(last_response).to be_ok
        expect(last_response.headers['Last-Modified']).to eql(Time.now.utc)
      end
    end

    context 'POST /validate/jenkins' do
      context 'with an empty payload' do
        before { post '/validate/jenkins' }

        it 'should 400' do
          expect(last_response.status).to eql(400)
        end
      end

      context 'with a bare minimum payload', :type => :integration do
        let(:json) do
          {
            :core => nil,
            :plugins => {
              :essential => {
              },
            },
            :metadata => {
            },
          }
        end

        before :each do
          post('/validate/jenkins', JSON.dump(json), {'CONTENT_TYPE' => 'application/json' })
        end

        it 'should 200' do
          expect(last_response).to be_ok
        end

        it 'should return a valid manifest with an update' do
          manifest = JSON.load(last_response.body)
          expect(manifest).to be_instance_of Hash
        end
      end
    end
  end
end
