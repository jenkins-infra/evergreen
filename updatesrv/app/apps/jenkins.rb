require 'net/http'
require 'openssl'
require 'time'

require 'concurrent/hash'
require 'faraday'
require 'mini_cache'

module Updatesrv
  module Apps
    # Jenkins is an Updatesrv app responsible for checking for war/plugin
    # updates
    #
    # This class implements the Updatesrv App protocol and an instance will
    # keep track of the upstream +update-center.json+
    class Jenkins
      attr_accessor :downloader

      ESSENTIALS = [
        :git,
        :junit,
      ].freeze

      class Downloader
        UPDATE_CENTER_URL = 'https://updates.jenkins.io/current/update-center.actual.json'.freeze
        CORE_URL = 'https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war'.freeze
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
          raise NotImplementedError
        end

        def fetch_update_center
          raise NotImplementedError
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
          @core = nil
        end
      end

      # Return an update manifest if the sender of the provided manifest should
      # update to the latest software. Otherwise return falsey
      #
      # @param [Jenkins::Manifest] manifest
      # @return [Jenkins::UpdateManifest]
      def should_update?(manifest)
        return false unless manifest
        return false unless manifest[:core] or manifest[:plugins]

        update = UpdateManifest.new
        current_core = downloader.fetch_core_md5
        current_uc = downloader.fetch_update_center

        if manifest[:core] != current_core
          update.core = current_core
        end

        provided = manifest[:plugins][:essential]
        ESSENTIALS.each do |essential|
          updated = current_uc[:plugins][essential]
          # TODO: log this as a warning
          next unless updated

          should_update = true
          if provided
            version = provided[essential]
            should_update = Gem::Version.new(version) < Gem::Version.new(updated[:version])
          end

          if should_update
            update.plugins << {
              :name => essential,
              :version => updated[:version],
              :url => updated[:url],
            }

            # if we should update, then that means we should also check
            # dependency versions
            if depends = updated[:dependencies]
              should_update_depend = true
              depends.each do |dep|
                dep_name = dep[:name].to_sym
                if provided && provided[dep_name]
                  should_update_depend = Gem::Version.new(provided[dep_name]) < Gem::Version.new(dep[:version])
                end

                if should_update_depend
                  update.plugins << {
                    :name => dep_name,
                    :version => current_uc[:plugins][dep_name][:version],
                    :url => current_uc[:plugins][dep_name][:url],
                  }
                end
              end
            end
          end
        end

        # Since we're lazily adding dependencies, filter out duplicates
        update.plugins.uniq! { |p| p[:name] }

        return update
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
        if @downloader.nil?
          @downloader = Downloader.new
        end
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
      end
    end
  end
end
