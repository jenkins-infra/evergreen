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

        stage('Build container') {
            steps {
                sh 'make container'
            }
        }
    }
}

// vim: ft=groovy
