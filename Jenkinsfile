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
  }
}