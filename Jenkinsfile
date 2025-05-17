pipeline {
    agent any

    stages {
        stage('Prepare') {
            steps {
                script {
                    docker.image('bitnami/git:2.49.0').inside('--entrypoint=') {
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
                script {
                    docker.image('node:24-slim').inside('-e HOME=/tmp/home') {
                        sh 'npm config set cache /tmp/npm-cache --location=user'
                        sh 'npm ci'
                        stash name: 'node_modules', includes: 'node_modules/**'
                    }
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    docker.image('node:24-slim').inside {
                        withChecks(name: 'Build project') {
                            unstash 'node_modules'
                            sh 'npm run build'
                            publishChecks name: 'Build project', status: 'COMPLETED', conclusion: 'SUCCESS'
                        }
                    }
                }
            }
        }

        stage('Basic checks') {
            parallel {
                stage('Lint') {
                    agent any
                    steps {
                        script {
                            docker.image('node:24-slim').inside {
                                withChecks(name: 'ESLint') {
                                    unstash 'node_modules'
                                    sh 'npm run lint'
                                    publishChecks name: 'ESLint', status: 'COMPLETED', conclusion: 'SUCCESS'
                                }
                            }
                        }
                    }
                }

                stage('Unit tests') {
                    agent any
                    steps {
                        script {
                            docker.image('node:24-slim').inside {
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
                    withCredentials([
                        usernamePassword(
                            credentialsId: 'docker-hub', 
                            usernameVariable: 'DOCKER_USER', 
                            passwordVariable: 'DOCKER_PASSWORD'
                        )
                    ]) {
                        def authJson = '''
                            {
                                "auths": {
                                    "https://index.docker.io/v1/": {
                                        "username": "%s",
                                        "password": "%s"
                                    }
                                }
                            }
                        '''.stripIndent().trim()
                        
                        def config = String.format(authJson, env.DOCKER_USER, env.DOCKER_PASSWORD)
                        writeFile file: '.docker-config.json', text: config
                        
                        def imageName = readFile('image-name.txt').trim()
                        def imageTag = readFile('image-tag.txt').trim()
                        def imageTagEnvironment = (env.GIT_TAG_NAME || env.TAG_NAME) ? 'latest' : 'staging'

                        sh """
                            docker run --rm \
                                -v ${pwd()}:/workspace \
                                -v ${pwd()}/.docker-config.json:/kaniko/.docker/config.json \
                                gcr.io/kaniko-project/executor:latest \
                                    --context=/workspace \
                                    --dockerfile=/workspace/Dockerfile \
                                    --destination=${imageName}:${imageTag} \
                                    --destination=${imageName}:${imageTagEnvironment}
                        """
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
                    docker.image('lachlanevenson/k8s-helm:v3.10.2').inside('--entrypoint=') {
                        def isTagBuild = env.GIT_TAG_NAME || env.TAG_NAME
                        def dbCredentialsId = isTagBuild ? 'postgres-prod' : 'postgres-staging'
                        def kubeConfigCredentialsId = isTagBuild ? 'kube-config-prod' : 'kube-config-staging'

                        // Releasing Helm chart
                        def imageTag = readFile('image-tag.txt').trim()

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
    }

    post {
        always {
            cleanWs()
        }
    }
}