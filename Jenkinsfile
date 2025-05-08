pipeline {
    agent any

    stages {
        stage('Hello, world!') {
            steps {
                withChecks(name: 'Hello, check!') {
                    script {
                        writeFile file: 'test.xml', text: '''
                        <testsuite tests="1">
                          <testcase classname="dummy" name="test"/>
                        </testsuite>
                        '''
                        junit 'test.xml'
                    }
                }
            }
        }
    }
}