pipeline {
    agent any

    stages {
        stage('Install') {
            steps {
                sh 'npm install'
                stash name: 'node_modules', includes: 'node_modules/**'
            }
        }

        stage('Build') {
            steps {
                withChecks(name: 'Build project') {
                    unstash 'node_modules'
                    sh 'npm run build'
                }
            }
        }
    }
}