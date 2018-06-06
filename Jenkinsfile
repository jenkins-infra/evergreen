pipeline {
    agent { label 'linux' }

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(daysToKeepStr: '10'))
    }

    triggers {
        pollSCM('H * * * *')
    }

    stages {
        stage('Prepare Workspace') {
            steps {
                sh 'make clean || true'
            }
        }

        stage('Lint code') {
          steps {
              sh 'make lint'
          }
        }

        stage('Verifications') {
            parallel {
                stage('Client') {
                    steps {
                        sh 'make -C client check'
                    }
                    post {
                        success {
                            archiveArtifacts 'client/coverage/**'
                        }
                    }
                }
                stage('Services') {
                    steps {
                        sh 'make -C services check'
                    }
                    post {
                        success {
                            archiveArtifacts 'services/coverage/**'
                        }
                    }
                }
            }
        }

        stage('Build jenkins/evergreen') {
            steps {
              sh 'make container'
            }
        }

        stage('Test images') {
            parallel {
                stage('Base image') {
                  agent { label 'linux' }
                  steps {
                      sh 'make base-container-check'
                  }
                  post {
                      always {
                          archiveArtifacts artifacts: 'build/tests-run*/**.log*'
                      }
                  }
                }
                stage('Docker Cloud image') {
                  agent { label 'linux' }
                  steps {
                      sh 'make docker-cloud-container-check'
                  }
                  post {
                      always {
                          archiveArtifacts artifacts: 'build/tests-run*/**.log*'
                      }
                  }
                }
            }
        }

        stage('Publish jenkins/evergreen') {
            when {
                expression { infra.isTrusted() }
            }

            steps {
                withCredentials([[$class: 'ZipFileBinding',
                           credentialsId: 'jenkins-dockerhub',
                                variable: 'DOCKER_CONFIG']]) {
                    sh 'make publish'
                }
            }
        }

    }
}

// vim: ft=groovy
