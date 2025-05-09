pipeline {
    agent any

    stages {
        stage('Build') {
            steps {
                withChecks(name: 'Build project') {
                    sh 'npm run build'
                    // publishChecks name: 'Build project', status: 'COMPLETED', conclusion: 'SUCCESS'
                }
            }
        }
    }
}