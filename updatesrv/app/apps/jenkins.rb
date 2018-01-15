require 'time'

module Updatesrv
  module Apps
    # Jenkins is an Updatesrv app responsible for checking for war/plugin
    # updates
    #
    # This class implements the Updatesrv App protocol and an instance will
    # keep track of the upstream +update-center.json+
    class Jenkins
      UPDATE_CENTER_URL = 'https://updates.jenkins.io/current/update-center.actual.json'.freeze
      CORE_URL = 'https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war'.freeze
      CORE_MD5_URL = 'https://ci.jenkins.io/job/Core/job/jenkins/job/master/lastSuccessfulBuild/artifact/war/target/linux-jenkins.war/*fingerprint*/'.freeze

      # Object containing a full Jenkins distribution update manifest.
      #
      # This includes the core version and plugins considered to be part of the
      # "distribution"
      class UpdateManifest
        attr_reader :core, :plugins

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
        return false
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
        # no-op
        return false
      end

      # Invalidate all internal caches
      def invalidate!
        # no-op
      end

    end
  end
end
