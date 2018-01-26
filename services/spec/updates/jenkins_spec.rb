require 'spec_helper'

require 'app/updates/jenkins'

describe Updates::Jenkins do
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
        expect(response).to be_instance_of Updates::Jenkins::UpdateManifest
      end

      it 'should include a new core URL' do
        expect(response.core).to be_instance_of Hash
        expect(response.core[:md5]).to eql(mock_core_md5)
        expect(response.core[:url]).to match(/https:\/\/(.*)/)
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

  context '#resolve_dependencies_for' do
    let(:response) { subject.resolve_dependencies_for(plugin, manifest, update_center) }

    let(:plugin) { nil }
    let(:manifest) do
      {
        :core => 'md5sum',
        :plugins => {
          :essential => {
          }
        },
      }
    end
    let(:update_center) do
      {
        :plugins => {},
      }
    end

    context 'an update_center which lacks the plugin' do
      let(:update_center) do
        {
          :plugins => {},
        }
      end
      it 'should return nil' do
        expect(response).to be_nil
      end
    end

    context 'a plugin with dependencies' do
      let(:plugin) { :rspec }
      let(:update_center) do
        {
          :plugins => {
            :tdd => {
              :url => 'http://example.com/tdd',
              :version => '0.1.0',
              :name => 'tdd',
            },
            plugin => {
              :url => 'http://example.com',
              :version => '0.0.2',
              :name => 'rspec',
              :dependencies => [
                {
                  :name => 'tdd',
                  :version => '0.1.0',
                  :optional => false,
                }
              ],
            },
          }
        }
      end

      context 'with no prior version in the supplied manifest' do
        it 'should return a list containing just both plugins' do
          expect(response).to be_kind_of Array
          expect(response.size).to eql(2)
        end
      end

      context 'if those dependencies are optional' do
        it 'should not include those dependencies' do
          update_center[:plugins][plugin][:dependencies][0][:optional] = true
          expect(response).to be_kind_of Array
          expect(response.size).to eql(1)
          expect(response.first[:name]).to eql(plugin)
        end
      end

      context 'with second level dependencies' do
        it 'should return a list containing the full depth of dependencies' do
          depend = {
            :url => 'http://example.com/cukes',
            :version => '1.0.0',
            :name => 'cukes',
          }
          depends = [{:name => 'cukes', :optional => false, :version => '1.0.0'}]
          update_center[:plugins][:cukes] = depend
          update_center[:plugins][:tdd][:dependencies] = depends

          expect(response).to be_kind_of Array
          expect(response.size).to eql(3)
        end
      end

    end

    context 'a plugin with no dependencies' do
      let(:plugin) { :rspec }
      let(:update_center) do
        {
          :plugins => {
            plugin => {
              :url => 'http://example.com',
              :version => '0.0.2',
              :name => 'rspec',
            },
          }
        }
      end

      context 'with no prior version in the supplied manifest' do
        it 'should return a list containing just one plugin' do
          expect(response).to be_kind_of Array
          expect(response.size).to eql(1)
        end
      end

      context 'with a prior, lesser, version in the manifest' do
        let(:manifest) do
          {
            :core => 'md5sum',
            :plugins => {
              :essential => {
                :rspec => '0.0.1'
              }
            },
          }
        end
        it 'should return a list containing just one plugin' do
          expect(response).to be_kind_of Array
          expect(response.size).to eql(1)
        end
      end

      context 'with a prior, greater, version in the manifest' do
        let(:manifest) do
          {
            :core => 'md5sum',
            :plugins => {
              :essential => {
                :rspec => '1.0.0'
              }
            },
          }
        end
        it 'should return nil' do
          expect(response).to be_nil
        end
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

describe Updates::Jenkins::UpdateManifest do
  describe '#to_json' do
    let(:buf) { subject.to_json }
    it 'should encode to a string' do
      expect(buf).to be_instance_of String
    end

    it 'should be parseable JSON' do
      expect(JSON.parse(buf)).to be_instance_of Hash
    end
  end
end

describe Updates::Jenkins::Downloader, :type => :integration do
  it { should respond_to :fetch_core_md5 }
  describe '#fetch_core_md5' do
    let(:md5) { subject.fetch_core_md5 }

    it 'should be a string' do
      expect(md5).to be_instance_of String
    end
  end

  it { should respond_to :fetch_update_center }
end
