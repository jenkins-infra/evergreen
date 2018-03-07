pipeline {
    agent { label 'linux' }

    stages {
        stage('Prepare Workspace') {
            steps {
                sh 'make clean || true'
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

    }
}

// vim: ft=groovy
