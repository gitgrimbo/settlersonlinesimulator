importPackage(java.io);

var config = (function() {

var localAppsRoot = new File("Y:/");
//var localAppsRoot = new File("X:/backup/apps");

function url(partialFilePath) {
    return new File(localAppsRoot, partialFilePath).toURI()
}

return {
    selenium: {
        server: {
            url: url("dev/testing/selenium-server-standalone-2.43.1.jar")
        },
        chromedriver: {
            url: url("dev/testing/chromedriver/2.11/chromedriver_win32.zip")
        },
        iedriver: {
            url: url("dev/testing/iedriver/IEDriverServer_Win32_2.43.0.zip")
        }
    },
    sonar: {
        server: {
            url: url("dev/testing/sonar/sonar-3.7.3.zip")
        },
        // I don't use runner, I use the sonar maven plugin.
        runner: {
            url: url("dev/testing/sonar/sonar-runner-dist-2.3.zip")
        },
        javascript: {
            url: url("dev/testing/sonar/sonar-javascript-plugin-1.4.jar")
        }
    }
};

}());
