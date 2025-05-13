pipeline {
    agent any

    environment {
        IMAGE_NAME = 'dmi3papka/sample-nodejs-service'
        IMAGE_TAG_NAME = ''
    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    def tagName = env.GIT_TAG_NAME ?: env.TAG_NAME
                    def commit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    env.IMAGE_TAG_NAME = tagName ? tagName.replaceFirst(/^v/, '') : "staging-${commit}"
                }
            }
        }

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
                            junit (allowEmptyResults: true, testResults: 'junit.xml')
                            publishChecks name: 'Unit tests', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                    }
                }
            }
        }

        stage('Build image') {
            when {
                anyOf {
                    branch 'main'
                    expression {
                        env.BRANCH_NAME ==~ /^v\d+\.\d+\.\d+$/
                    }
                }
            }

            steps {
                script {
                    try {
                        withCredentials([
                            usernamePassword(
                                credentialsId: 'docker-hub', 
                                usernameVariable: 'DOCKER_USER', 
                                passwordVariable: 'DOCKER_PASSWORD'
                            )
                        ]) {
                            sh '''
                                echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USER" --password-stdin
                            '''
                        }

                        sh "docker image build -t ${env.IMAGE_NAME}:${env.IMAGE_TAG_NAME} ."
                        sh "docker push ${env.IMAGE_NAME}:${env.IMAGE_TAG_NAME}"

                        if (env.GIT_TAG_NAME || env.TAG_NAME) {
                            sh "docker image tag ${env.IMAGE_NAME}:${env.IMAGE_TAG_NAME} ${env.IMAGE_NAME}:staging"
                            sh "docker push ${env.IMAGE_NAME}:staging"
                        } else {
                            sh "docker image tag ${env.IMAGE_NAME}:${env.IMAGE_TAG_NAME} ${env.IMAGE_NAME}:latest"
                            sh "docker push ${env.IMAGE_NAME}:latest"
                        }

                    } finally {
                        sh 'docker logout'
                    }
                }
            }
        }

        stage('Deploy image') {
            when {
                anyOf {
                    branch 'main'
                    expression {
                        env.BRANCH_NAME ==~ /^v\d+\.\d+\.\d+$/
                    }
                }
            }

            steps {
                script {
                    def isTagBuild = env.GIT_TAG_NAME || env.TAG_NAME
                    def credentialsId = isTagBuild ? 'kube-config-prod' : 'kube-config-staging'

                    withCredentials([file(credentialsId: credentialsId, variable: 'KUBECONFIG_FILE')]) {
                        sh """
                            export KUBECONFIG=\${KUBECONFIG_FILE}
                            helm upgrade --install -f ./chart/main/values.yaml \\
                                --set image.tag=${env.IMAGE_TAG_NAME} \\
                                sample-nodejs-service ./chart/main
                        """
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