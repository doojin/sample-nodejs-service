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
                            sh 'npm run test:ci'
                            junit 'junit.xml'
                            publishChecks name: 'Unit tests', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                    }
                }
            }
        }

        stage('Image build') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def image = 'dmi3papka/sample-nodejs-service'
                    def commit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def tag = "staging-${commit}"
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: 'docker-hub', 
                                usernameVariable: 'DOCKER_USER', 
                                passwordVariable: 'DOCKER_PASSWORD'
                            )
                        ]) {
                            sh "echo \"$DOCKER_PASSWORD\" | docker login -u \"$DOCKER_USER\" --password-stdin"
                        }

                        sh "docker image build -t ${image}:${tag} ."
                        sh "docker image tag ${image}:${tag} ${image}:staging"

                        sh "docker push ${image}:${tag}"
                        sh "docker push ${image}:staging"
                    } finally {
                        sh 'docker logout'
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}