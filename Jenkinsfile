pipeline {
    agent any

    stages {
        stage('Hello, world!') {
            steps {
                withChecks(name: 'Hello, check!') {
                    sh 'echo Hello, world!'
                }
            }
        }
    }
}