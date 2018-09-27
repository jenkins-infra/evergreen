pipeline {
    agent any

    triggers {
        upstream 'Infra/evergreen/master'
    }

    stages {
        stage('Notify webhook') {
            environment {
                TOKEN = credentials('evergreen-upload-token')
            }

            steps {
                echo 'Simulating a GitHub webhook call to the evergreen-upload Azure Function'
                sh '''
                    curl -v --fail -H 'X-GitHub-Event: push' \
                        -d '{"ref":"refs/heads/master", "repository": {"full_name" : "jenkins-infra/evergreen"}, "commits": []}' \
                        https://jenkins-infra-functions.azurewebsites.net/api/evergreen-upload?code=${TOKEN}&clientId=default
                '''
                echo '..webhook notified'
            }
        }
    }
}

// vim: ft=groovy
