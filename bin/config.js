var config = {
    selenium: {
        server: {
            url: "http://selenium.googlecode.com/files/selenium-server-standalone-2.38.0.jar"
        },
        chromedriver: {
            url: "http://chromedriver.storage.googleapis.com/2.7/chromedriver_win32.zip"
        },
        iedriver: {
            url: "https://selenium.googlecode.com/files/IEDriverServer_x64_2.38.0.zip"
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
