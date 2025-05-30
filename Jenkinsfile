pipeline {
  agent {
    kubernetes {
      yaml '''
        apiVersion: v1
        kind: Pod
        spec:
          containers:
            - name: alpine
              image: alpine:latest
              command:
                - cat
              tty: true
      '''
    }
  }

  stages {
    stage('Greetings') {
      steps {
        container('alpine') {
          sh 'echo Hello, world!'
        }
      }
    }
  }
}