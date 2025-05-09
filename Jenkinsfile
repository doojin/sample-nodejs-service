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
                    publishChecks name: 'Build project', status: 'COMPLETED', conclusion: 'SUCCESS'
                }
            }
        }

        stage('Basic checks') {
            parallel {
                stage('Lint') {
                    agent any
                    steps {
                        withChecks(name: 'ESLint') {
                            unstash 'node_modules'
                            sh 'npm run lint'
                            publishChecks name: 'ESLint', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                    }
                }

                stage('Unit tests') {
                    agent any
                    steps {
                        withChecks(name: 'Unit tests') {
                            unstash 'node_modules'
                            sh 'npm run test'
                            publishChecks name: 'Unit tests', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                    }
                }
            }
        }
    }
}