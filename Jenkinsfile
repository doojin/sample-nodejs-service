pipeline {
    agent any

    stages {
        stage('Hello, world!') {
            steps {
                echo 'I\'m actually working!!!'
            }
        }
    }

    post {
        success {
            githubNotify context: 'CI / Build', status: 'SUCCESS'
        }
        failure {
            githubNotify context: 'CI / Build', status: 'FAILURE'
        }
    }
}