require 'spec_helper'

require 'apps/jenkins'

describe Updatesrv::Apps::Jenkins do
  let(:mock_core_md5) { 'c4ad6cef1b81e8e4dc7a1d66f41f78cd' }

  it { should respond_to :last_refreshed? }
  describe '#last_refreshed?' do
    it 'should return a Time' do
      expect(subject.last_refreshed?).to be_kind_of Time
    end
  end

  it { should respond_to :refresh }
  describe '#refresh' do
    it 'should fetch from the distribution sites' do
      pending 'need to implement download first'
      fail
    end
  end

  it { should respond_to :invalidate! }
  describe '#invalidate!' do
    it 'should return nil' do
      expect(subject.invalidate!).to be_nil
    end
  end

  it { should respond_to :should_update? }
  describe '#should_update?' do
    before :each do
      subject.downloader = MockDownloader.new
    end

    it 'should be false with an invalid manifest' do
      expect(subject.should_update?(nil)).to_not be_truthy
    end

    context 'with an empty Manifest' do
      let(:manifest) do
        {
          :core => nil,
          :plugins => {},
          :metadata => {},
        }
      end
      let(:response) { subject.should_update? manifest }

      it 'should return a full UpdateManifest' do
        expect(response).to be_instance_of Updatesrv::Apps::Jenkins::UpdateManifest
      end

      it 'should include a new core md5' do
        expect(response.core).to eql(mock_core_md5)
      end

      it 'should include Essential plugins' do
        expect(response.plugins).to be_instance_of Array
        # Our MockDownloader includes a dependency which must be traversed. If
        # we don't have two plugins (git, git-client) then that means the
        # Updatesrv hasn't given us all our updates
        expect(response.plugins.size).to eql(2)
      end
    end
  end
end

class MockDownloader
  def fetch_core_md5
    'c4ad6cef1b81e8e4dc7a1d66f41f78cd'
  end

  def fetch_update_center
    {
      :core => {
        # not really relevant
      },
      :plugins => {
        :'git-client' => {
          :version => '2.7.0',
          :previousVersion => '2.6.0',
          :url => 'https://updates.jenkins.io/download/plugins/git-client/2.7.0/git-client.hpi',
        },
        :git => {
          :dependencies => [
            {
              :name => 'git-client',
              :version => '2.7.0',
              :optional => false,
            },
          ],
          :version => '3.7.0',
          :previousVersion => '3.6.4',
          :url => 'https://updates.jenkins.io/download/plugins/git/3.7.0/git.hpi',
        }
      },
    }
  end
end

describe Updatesrv::Apps::Jenkins::Downloader, :type => :integration do
  it { should respond_to :fetch_core_md5 }
  describe '#fetch_core_md5' do
    let(:md5) { subject.fetch_core_md5 }

    it 'should be a string' do
      expect(md5).to be_instance_of String
    end
  end

  it { should respond_to :fetch_update_center }
end
