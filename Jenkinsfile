pipeline {
    agent any

    stages {
        stage('Hello, world!') {
            steps {
                withChecks(name: 'Hello, check!') {
                    echo 'I\'m actually working!'
                }
            }
        }
    }
}