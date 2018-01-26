require 'json'
require 'net/http'
require 'openssl'
require 'time'

require 'concurrent/hash'
require 'faraday'
require 'nokogiri'
require 'mini_cache'

module Updates
  # Jenkins is an Updatesrv app responsible for checking for war/plugin
  # updates
  #
  # This class implements the Updatesrv App protocol and an instance will
  # keep track of the upstream +update-center.json+
  class Jenkins
    attr_accessor :downloader

    CACHE_EXPIRY = 5 * 60
    ESSENTIALS = [
      :git,
      :junit,
      :'workflow-aggregator',
    ].freeze

    CORE_URL = 'https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war'.freeze

    class Downloader
      UPDATE_CENTER_URL = 'https://updates.jenkins.io/current/update-center.actual.json'.freeze
      CORE_MD5_URL = 'https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war/*fingerprint*/'.freeze

      # Non-fatal network errors
      COMMON_NETWORK_ERRORS = [
        Timeout::Error,
        Errno::EINVAL,
        Errno::ECONNRESET,
        EOFError,
        Faraday::ConnectionFailed,
        Faraday::TimeoutError,
        Net::HTTPBadResponse,
        Net::HTTPHeaderSyntaxError,
        Net::ProtocolError,
        OpenSSL::SSL::SSLError,
      ].freeze

      def fetch_core_md5
        response = connection.get(CORE_MD5_URL)
        return nil unless response.success?
        page = Nokogiri::HTML(response.body)
        md5 = page.css('.md5sum')
        return nil unless md5
        return md5.text.split('MD5: ').last
      rescue *COMMON_NETWORK_ERRORS
        # TODO This is an expected error and should be logged under DEBUG
      end

      def fetch_update_center
        puts Time.now.utc
        response = connection.get(UPDATE_CENTER_URL)
        return nil unless response.success?
        r = JSON.load(response.body)
        return Hashie.symbolize_keys(r)
      end

      private

      def connection
        return Faraday.new(:ssl => { :verify => true }) do |f|
          f.adapter Faraday.default_adapter
          f.options.timeout = 45
          f.options.open_timeout = 3
        end
      end
    end

    # Object containing the current distribution manifest for an instance
    #
    #   {
    #     "core"     : "<md5sum>",
    #     "plugins"  : {
    #       "essential"   : {
    #         "git" : "1.0.1",
    #         "git-client" : "1.1.1"
    #       },
    #       "inessential" : {
    #         "azure-vm-agents" : "1.0.2"
    #       }
    #     },
    #     "metadata" : {
    #       "instance" : {
    #         "id" : "<instanceid>",
    #         "initialBoot" : "<iso8601-of-first-boot-timestamp>"
    #       }
    #     }
    #   }
    class Manifest
    end

    # Object containing a full Jenkins distribution update manifest.
    #
    # This includes the core version and plugins considered to be part of the
    # "distribution"
    class UpdateManifest
      attr_accessor :core, :plugins

      def initialize
        @plugins = []
        @core = {}
      end

      def to_json(*a)
        {
          :core => self.core,
          :plugins => self.plugins,
        }.to_json(*a)
      end
    end

    # Return an update manifest if the sender of the provided manifest should
    # update to the latest software. Otherwise return falsey
    #
    # @param [Jenkins::Manifest] manifest
    # @return [Jenkins::UpdateManifest]
    def should_update?(manifest)
      return false unless manifest

      update = UpdateManifest.new
      current_core = @cache.get_or_set('core', :expires_in => CACHE_EXPIRY) do
        MiniCache::Data.new(downloader.fetch_core_md5)
      end
      current_uc = @cache.get_or_set('uc',  :expires_in => CACHE_EXPIRY) do
        MiniCache::Data.new(downloader.fetch_update_center)
      end

      if manifest[:core] != current_core
        update.core = {
          :md5 => current_core,
          :url => CORE_URL,
        }
      end

      provided = manifest[:plugins][:essential]
      plugins = []
      ESSENTIALS.each do |essential|
        dependencies = resolve_dependencies_for(essential, manifest, current_uc)
        next if dependencies.nil?
        plugins = plugins + dependencies
      end
      # Since we're lazily adding dependencies, filter out duplicates
      update.plugins = plugins.uniq { |p| p[:name] }
      return update
    end

    def resolve_dependencies_for(plugin, manifest, update_center)
      latest = update_center[:plugins][plugin]
      # TODO: Log the lack of a latest version as a warning
      return nil unless latest
      response = []

      if dependencies = latest[:dependencies]
        dependencies.each do |depends|
          next if depends[:optional]
          tree = resolve_dependencies_for(depends[:name].to_sym,
                                          manifest,
                                          update_center)
          next if tree.nil?
          response = response + tree
        end
      end

      prior = nil
      if manifest[:plugins] && manifest[:plugins][:essential]
        prior = manifest[:plugins][:essential][plugin]
      end
      if prior.nil? || (Gem::Version.new(prior) < Gem::Version.new(latest[:version]))
        response << {
            :name => plugin,
            :version => latest[:version],
            :url => latest[:url],
          }
      end

      return response unless response.empty?
    end

    # Return the time of the last update from the upstream distribution
    def last_refreshed?
      return Time.now.utc
    end

    # Refresh internal data structures from the upstream distribution
    # provider.
    #
    # In this case, refresh will grab the latest +update-center.json+ for
    # processing by this object
    #
    # @return [Boolean] True if refresh has been successful
    def refresh
      return false
    end

    # Invalidate all internal caches
    def invalidate!
      @cache = MiniCache::Store.new
      return nil
    end

    def initialize
      # Clear the internal cache
      self.invalidate!
      @downloader = Downloader.new
    end
  end
end
