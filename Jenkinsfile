pipeline {
    agent { label 'linux' }

    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(daysToKeepStr: '10'))
        timestamps()
    }

    triggers {
        pollSCM('H * * * *')
        cron('H H * * *')
    }

    environment {
        // Squid is enabled by default in the dev environment
        DISABLE_PROXY_CACHE = 'true'
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

        stage('Confirm Dependencies') {
            steps {
                sh 'make -C services generate-ingest'
            }
            post {
                success {
                    archiveArtifacts artifacts: 'services/ingest.json', fingerprint: true
                    archiveArtifacts artifacts: 'services/essentials.yaml', fingerprint: true
                }
            }
        }

        stage('Verifications') {
            parallel {
                stage('Evergreen Client') {
                    steps {
                        sh 'make -C distribution/client check'
                    }
                    post {
                        success {
                            archiveArtifacts 'distribution/client/coverage/**'
                        }
                    }
                }
                stage('Backend Services') {
                    steps {
                        sh 'make -C services check'
                    }
                    post {
                        success {
                            archiveArtifacts 'services/coverage/**'
                        }
                        cleanup {
                            sh 'make -C services stop'
                        }
                    }
                }
            }
        }

        stage('Build images') {
            parallel {
                stage('jenkins/evergreen') {
                    environment {
                        // Since tests have already been successfully run, skip them
                        SKIP_TESTS = 'true'
                    }
                    steps {
                        sh 'make -C distribution container'
                    }
                }

                stage('jenkinsciinfra/evergreen-backend') {
                    environment {
                        // Since tests have already been successfully run, skip them
                        SKIP_TESTS = 'true'
                    }
                    steps {
                        sh 'make -C services container'
                    }
                }
            }
            post {
                cleanup {
                    sh 'make -C services stop'
                }
            }
        }

        stage('Test images') {
            environment {
                // Since tests have already been successfully run, skip them
                SKIP_TESTS = 'true'
            }

            parallel {
                stage('Base image') {
                  agent { label 'linux' }
                  steps {
                      sh 'make -C distribution base-container-check'
                  }
                  post {
                      always {
                          archiveArtifacts artifacts: '**/build/tests-run*/**.log*'
                      }
                  }
                }
                stage('Docker Cloud image') {
                  agent { label 'linux' }
                  steps {
                      sh 'make -C distribution docker-cloud-container-check'
                  }
                  post {
                      always {
                          archiveArtifacts artifacts: '**/build/tests-run*/**.log*'
                      }
                  }
                }
                stage('AWS Cloud image (smokes)') {
                  agent { label 'linux' }
                  steps {
                      sh 'make -C distribution aws-cloud-container-check'
                  }
                  post {
                      always {
                          archiveArtifacts artifacts: '**/build/tests-run*/**.log*'
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
