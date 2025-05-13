pipeline {
    agent any

    stages {
        stage('Prepare') {
            steps {
                script {
                    docker.image('bitnami/git:latest').inside {
                        def tagName = env.GIT_TAG_NAME ?: env.TAG_NAME
                        def commit = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        def imageTag = tagName ? tagName.replaceFirst(/^v/, '') : "staging-${commit}"

                        writeFile(file: 'image-tag.txt', text: imageTag)
                        writeFile(file: 'image-name.txt', text: 'dmi3papka/sample-nodejs-service')

                        stash(name: 'image-metadata', includes: 'image-tag.txt,image-name.txt')
                    }
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
                unstash 'image-metadata'
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

                        def imageName = readFile('image-name.txt').trim()
                        def imageTag = readFile('image-tag.txt').trim()

                        sh "docker image build -t ${imageName}:${imageTag} ."
                        sh "docker push ${imageName}:${imageTag}"

                        if (env.GIT_TAG_NAME || env.TAG_NAME) {
                            sh "docker image tag ${imageName}:${imageTag} ${imageName}:staging"
                            sh "docker push ${imageName}:staging"
                        } else {
                            sh "docker image tag ${imageName}:${imageTag} ${imageName}:latest"
                            sh "docker push ${imageName}:latest"
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
                unstash 'image-metadata'
                script {
                    def isTagBuild = env.GIT_TAG_NAME || env.TAG_NAME
                    def dbCredentialsId = isTagBuild ? 'postgres-prod' : 'postgres-staging'
                    def kubeConfigCredentialsId = isTagBuild ? 'kube-config-prod' : 'kube-config-staging'

                    // Preparing database secrets
                    withCredentials([
                        usernamePassword(
                            credentialsId: dbCredentialsId,
                            usernameVariable: 'DB_USERNAME',
                            passwordVariable: 'DB_PASSWORD'
                        ),
                        file(
                            credentialsId: kubeConfigCredentialsId,
                            variable: 'KUBECONFIG_FILE'
                        )
                    ]) {
                        sh """
                            export KUBECONFIG=\${KUBECONFIG_FILE}
                            kubectl create secret generic db-password \\
                                --from-literal=username=\$DB_USERNAME \\
                                --from-literal=password=\$DB_PASSWORD \\
                                --dry-run=client -o yaml | kubectl apply -f -
                        """
                    }

                    // Releasing Helm chart
                    def imageTag = readFile('image-tag.txt').trim()

                    withCredentials([file(credentialsId: kubeConfigCredentialsId, variable: 'KUBECONFIG_FILE')]) {
                        sh """
                            export KUBECONFIG=\${KUBECONFIG_FILE}
                            helm repo add bitnami https://charts.bitnami.com/bitnami
                            helm repo update
                            helm dependency build chart/main
                            helm upgrade --install -f ./chart/main/values.yaml \\
                                --set image.tag=${imageTag} \\
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