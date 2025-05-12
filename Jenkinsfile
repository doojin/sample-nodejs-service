pipeline {
    agent any

    stages {
        stage('Prepare') {
            steps {
                script {
                    def tagName = env.GIT_TAG_NAME ?: env.TAG_NAME
                    def commit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                    def tag = tagName ? tagName.replaceFirst(/^v/, '') : "staging-${commit}"

                    writeFile file: 'image-tag.txt', text: tag
                    writeFile file: 'image-name.txt', text: 'dmi3papka/sample-nodejs-service'

                    stash name: 'image-metadata', includes: 'image-tag.txt,image-name.txt'
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
                unstash 'image-metadata'

                script {
                    def image = readFile('image-name.txt').trim()
                    def tag = readFile('image-tag.txt').trim()

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

                        sh "docker image build -t ${image}:${tag} ."
                        sh "docker push ${image}:${tag}"

                        if (env.GIT_TAG_NAME || env.TAG_NAME) {
                            sh "docker image tag ${image}:${tag} ${image}:staging"
                            sh "docker push ${image}:staging"
                        } else {
                            sh "docker image tag ${image}:${tag} ${image}:latest"
                            sh "docker push ${image}:latest"
                        }

                    } finally {
                        sh 'docker logout'
                    }
                }
            }
        }

        stage('Deploy image') {
            when {
                branch 'main'
            }

            steps {
                unstash 'image-metadata'

                script {
                    def isTagBuild = env.GIT_TAG_NAME || env.TAG_NAME
                    def credentialsId = isTagBuild ? 'kube-config-prod' : 'kube-config-staging'

                    withCredentials([file(credentialsId: credentialsId, variable: 'KUBECONFIG_FILE')]) {
                        def tag = readFile('image-tag.txt').trim()

                        sh """
                            export KUBECONFIG=\${KUBECONFIG_FILE}
                            helm upgrade --install -f ./chart/main/values.yaml \\
                                --set image.tag=${tag} \\
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