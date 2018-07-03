import io.jenkins.plugins.artifact_manager_jclouds.s3.S3BlobStoreConfig
import jenkins.model.ArtifactManagerConfiguration
import io.jenkins.plugins.artifact_manager_jclouds.JCloudsArtifactManagerFactory
import io.jenkins.plugins.artifact_manager_jclouds.s3.S3BlobStore

// FIXME: remove this file and do it with CasC
// For now, I was only able to do the S3 Blob store part

// Scavenged from https://github.com/jenkinsci/artifact-manager-s3-plugin/blob/f4232574ecda79fecf2e4fdfac8feab47f20cb3a/src/test/it/initScripts/enableArtifactManager.groovy
// Thanks Ivan & Oleg
def factory = new JCloudsArtifactManagerFactory(new S3BlobStore());
ArtifactManagerConfiguration.get().artifactManagerFactories.add(factory)
println("--- Enabling default artifact storage: ${factory.descriptor.displayName}")
