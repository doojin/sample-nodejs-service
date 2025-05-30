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
            stash name: 'node_modules', includes: 'node_modules/**'
          }
        }
      }
    }

    stage('Build project') {
      steps {
        container('nodejs') {
          script {
            withChecks(name: 'Build project') {
              unstash 'node_modules'
              sh 'npm run build'
              publishChecks name: 'Build project', status: 'COMPLETED', conclusion: 'SUCCESS'
            }
          }
        }
      }
    }
  }
}