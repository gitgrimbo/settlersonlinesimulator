var config = {
    selenium: {
        server: {
            url: "http://selenium-release.storage.googleapis.com/2.43/selenium-server-standalone-2.43.1.jar"
        },
        chromedriver: {
            url: "http://chromedriver.storage.googleapis.com/2.11/chromedriver_win32.zip"
        },
        iedriver: {
            url: "http://selenium-release.storage.googleapis.com/2.43/IEDriverServer_x64_2.43.0.zip"
        }
    },
    sonar: {
        server: {
            url: "http://dist.sonar.codehaus.org/sonar-3.7.3.zip"
        },
        // I don't use runner, I use the sonar maven plugin.
        runner: {
            url: "http://repo1.maven.org/maven2/org/codehaus/sonar/runner/sonar-runner-dist/2.3/sonar-runner-dist-2.3.zip"
        },
        javascript: {
            url: "http://repository.codehaus.org/org/codehaus/sonar-plugins/javascript/sonar-javascript-plugin/1.4/sonar-javascript-plugin-1.4.jar"
        }
    }
};
