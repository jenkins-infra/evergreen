pipeline {
    agent { label 'linux' }
    tools {
      maven 'mvn'
      jdk 'jdk8'
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

        stage('Verify Client') {
            steps {
                sh 'make -C client check'
            }
        }

        stage('Verify Services') {
            steps {
                sh 'make -C services check'
            }
        }

        stage('Build jenkins/evergreen') {
            steps {
              sh 'make container'
            }
        }

        stage('Test jenkins/evergreen') {
            steps {
                sh 'make container-check'
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
