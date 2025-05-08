pipeline {
    agent any

    stages {
        stage('Hello, world!') {
            steps {
                withChecks(name: 'Hello, check!') {
                    echo 'Hello, world!'
                    publishChecks name: 'Hello, check!', status: 'COMPLETED', conclusion: 'SUCCESS'
                }
            }
        }
    }
}