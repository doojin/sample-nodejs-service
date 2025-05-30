pipeline {
  agent {
    kubernetes {
      yaml '''
        apiVersion: v1
        kind: Pod
        spec:
          containers:
            - name: git
              image: bitnami/git:2.49.0
              command:
                - cat
              tty: true

            - name: nodejs
              image: node:24-slim
              command:
                - cat
              tty: true
              env:
                - name: HOME
                  value: /tmp/home

            - name: kaniko
              image: gcr.io/kaniko-project/executor:debug
              command:
                - cat
              tty: true
              volumeMounts:
                - name: docker-config
                  mountPath: /kaniko/.docker
                - name: workspace
                  mountPath: /workspace

            - name: helm-kubectl
              image: dtzar/helm-kubectl:3.17.2
              command:
                - cat
              tty: true
              env:
                - name: HOME
                  value: /tmp/home

          volumes:
            - name: docker-config
              emptyDir: {}
            - name: workspace
              emptyDir: {}
      '''
    }
  }

  stages {
    stage('Prepare') {
      steps {
        container('git') {
          script {
            sh 'git config --global --add safe.directory "$WORKSPACE"'

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

    stage('Install project dependencies') {
      steps {
        container('nodejs') {
          script {
            sh 'npm config set cache /tmp/npm-cache --location=user'
            sh 'npm ci'
          }
        }
      }
    }

    stage('Build project') {
      steps {
        container('nodejs') {
          script {
            withChecks(name: 'Build project') {
              sh 'npm run build'
              publishChecks name: 'Build project', status: 'COMPLETED', conclusion: 'SUCCESS'
            }
          }
        }
      }
    }

    stage('Run ESLint') {
      steps {
        container('nodejs') {
          script {
            withChecks(name: 'ESLint') {
              sh 'npm run lint'
              publishChecks name: 'ESLint', status: 'COMPLETED', conclusion: 'SUCCESS'
            }
          }
        }
      }
    }

    stage('Run unit tests') {
      steps {
        container('nodejs') {
          script {
            withChecks(name: 'Unit tests') {
              sh 'npm run test:ci'
              junit (allowEmptyResults: true, testResults: 'junit.xml')
              publishChecks name: 'Unit tests', status: 'COMPLETED', conclusion: 'SUCCESS'
            }
          }
        }
      }
    }

    stage('Build & push image') {
      when {
        anyOf {
          branch 'main'
          expression {
            env.BRANCH_NAME ==~ /^v\d+\.\d+\.\d+$/
          }
        }
      }

      steps {
        container('kaniko') {
          script {
            unstash 'image-metadata'

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

              sh 'cp -r . /workspace'
              
              def config = String.format(authJson, env.DOCKER_USER, env.DOCKER_PASSWORD)
              writeFile file: 'docker-config.json', text: config
              sh 'cp docker-config.json /kaniko/.docker/config.json'
              sh 'rm docker-config.json'
              
              def imageName = readFile('image-name.txt').trim()
              def imageTag = readFile('image-tag.txt').trim()
              def imageTagEnvironment = (env.GIT_TAG_NAME || env.TAG_NAME) ? 'latest' : 'staging'

              sh """
                /kaniko/executor \
                  --context=/workspace \
                  --dockerfile=/workspace/Dockerfile \
                  --destination=${imageName}:${imageTag} \
                  --destination=${imageName}:${imageTagEnvironment}
              """
            }
          }
        }
      }
    }

    stage('Deployment') {
      when {
        anyOf {
          branch 'main'
          expression {
            env.BRANCH_NAME ==~ /^v\d+\.\d+\.\d+$/
          }
        }
      }

      steps {
        container('helm-kubectl') {
          script {
            unstash 'image-metadata'
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

                mkdir -p \$HOME/.config
                
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
}