require 'spec_helper'

require 'apps/jenkins'

describe Updatesrv::Apps::Jenkins do
  it { should respond_to :last_refreshed? }
  describe '#last_refreshed?' do
    it 'should return a Time' do
      expect(subject.last_refreshed?).to be_kind_of Time
    end
  end

  it { should respond_to :refresh }
  describe '#refresh' do
  end

  it { should respond_to :invalidate! }
  describe '#invalidate!' do
    it 'should return nil' do
      expect(subject.invalidate!).to be_nil
    end
  end

  it { should respond_to :should_update? }
  describe '#should_update?' do
    it 'should be false with an invalid manifest' do
      expect(subject.should_update?(nil)).to_not be_truthy
    end

    context 'with an empty StatusManifest' do
      let(:manifest) do
        {
          :core => nil,
          :plugins => [],
          :metadata => {},
        }
      end

      it 'should return a full UpdateManifest' do
        response = subject.should_update? manifest

        expect(response).to be_instance_of Updatesrv::Apps::Jenkins::UpdateManifest
      end
    end
  end
end
