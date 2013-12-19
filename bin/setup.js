/*

Run using jrunscript from project root. E.g.:
  jrunscript bin\setup.js

Downloads selenium server and chrome driver and ie driver into ./tmp

Unpacks chrome driver and ie driver.

NOTE! Uses Windows-specific commands such as 'cmd' and 'copy'.

*/

// IMPORTS

importClass(java.lang.System);
importPackage(java.io);
importPackage(java.net);
importPackage(java.nio.channels);
importPackage(java.util);

// CONFIG

// config for the script
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

// Overrides if we've chosen a local install, or if we're running in a VirtualBox instance
var useLocalIfAvailable = true;

// The shared folder we expose to VirtualBox VMs and
// The local app cache
// These two folders must have the same sub-structure (and they should, as they *are* effectively the same folder)
var vmAppsRoot = new File("\\\\vboxsrv\\APPS");
var localAppsRoot = new File("X:/backup/apps");

// Simple test to see if we're on a VirtualBox VM
var isVBox = vmAppsRoot.exists() && vmAppsRoot.isDirectory();

var appsRoot = isVBox ? vmAppsRoot : (useLocalIfAvailable ? localAppsRoot : null);
if (appsRoot) {
    (function(appsRoot) {
        config.selenium.server.url = new File(appsRoot, "dev/testing/selenium-server-standalone-2.38.0.jar").toURI();
        config.selenium.chromedriver.url = new File(appsRoot, "dev/testing/chromedriver/2.7/chromedriver_win32.zip").toURI();
        config.selenium.iedriver.url = new File(appsRoot, "dev/testing/iedriver/IEDriverServer_Win32_2.38.0.zip").toURI();
        config.sonar.server.url = new File(appsRoot, "dev/testing/sonar/sonar-3.7.3.zip").toURI();
        config.sonar.runner.url = new File(appsRoot, "dev/testing/sonar/sonar-runner-dist-2.3.zip").toURI();
        config.sonar.javascript.url = new File(appsRoot, "dev/testing/sonar/sonar-javascript-plugin-1.4.jar").toURI();
    }(appsRoot));
}

// UTIL

function isInPath(path) {
    var SEP = File.pathSeparator;
    var env = System.getenv();
    for (var it = env.entrySet().iterator(); it.hasNext(); ) {
        var entry = it.next();
        if ("path" == entry.key.toLowerCase()) {
            return entry.value.split(SEP).indexOf(path) > -1;
        }
    }
    return false;
}

function urlFilename(url) {
    // ensure js string
    url += "";
    return url.substring(url.lastIndexOf('/') + 1, url.length);
}

function removeExtension(filename) {
    return new java.lang.String(filename).replaceFirst("[.][^.]+$", "");
}

function download(url, file) {
    var website = new URL(url);
    var rbc = Channels.newChannel(website.openStream());
    var fos = new FileOutputStream(file);
    fos.getChannel().transferFrom(rbc, 0, java.lang.Long.MAX_VALUE);
    return true;
}

function maybeDownload(url, file) {
    if (!file.exists()) {
        return download(url, file);
    }
    return false;
}

function doCommandIn(dir, command) {
    exec('cmd /c cd ' + dir + ' && ' + command);
}

function unzip(zip) {
    var dir = zip.getParentFile().getAbsolutePath();
    doCommandIn(dir, 'jar xvf ' + zip.getName());
}

// Caller is reponsible for quoting from and to if required.
function copy(dir, from, to) {
    doCommandIn(dir, 'copy ' + from + ' ' + to);
}





// START

var f = new File(".");
var tmp = new File(f, "tmp");

tmp.mkdirs();

/**
 * - Downloads the sonar zip.
 * - Expects the sonar extraction folder to be the same name as the zip name (with .zip removed).
 * - If the sonar extraction folder does not exist, extract the sonar zip.
 */
function downloadAndInstallSonar() {
    // Use for downloading and unzipping a zip that has a version-specific folder when unzipped.
    // e.g. sonar-runner-dist-2.3.zip contains contents like:
    //   sonar-runner-2.3/...
    // And sonar server is distributed the same way.
    // The folder returned is this version-specific folder.
    function maybeDownloadAndUnzip(file, url) {
        var foldername = removeExtension(file.getName());
        var folder = new File(file.getParentFile(), foldername);
        if (!folder.exists()) {
            maybeDownload(url, file);
            // Windows-specific!
            unzip(file);
        } else {
            println('Not downloading ' + url + ' as it seems it has already been extracted here ' + folder.getAbsolutePath() + '.\n');
        }
        return folder;
    }

    var sonarZip = new File(tmp, urlFilename(config.sonar.server.url));
    var sonarRunnerZip = new File(tmp, urlFilename(config.sonar.runner.url));
    var sonarJavascriptJar = new File(tmp, urlFilename(config.sonar.javascript.url));

    var sonarFolder = maybeDownloadAndUnzip(sonarZip, config.sonar.server.url);

    maybeDownloadAndUnzip(sonarRunnerZip, config.sonar.runner.url);

    // Download the javascript plugin, and copy to the right place in sonar.
    maybeDownload(config.sonar.javascript.url, sonarJavascriptJar);
    var sonarPluginsFolder = new File(sonarFolder, 'extensions/plugins');
    copy(sonarZip.getParentFile(), sonarJavascriptJar.getAbsolutePath(), sonarPluginsFolder.getAbsolutePath());
}

function downloadAndInstallSeleniumAndDrivers() {
    var seleniumJar = new File(tmp, urlFilename(config.selenium.server.url));
    var chromeDriverZip = new File(tmp, urlFilename(config.selenium.chromedriver.url));
    var ieDriverZip = new File(tmp, urlFilename(config.selenium.iedriver.url));

    maybeDownload(config.selenium.server.url, seleniumJar);
    maybeDownload(config.selenium.chromedriver.url, chromeDriverZip);
    maybeDownload(config.selenium.iedriver.url, ieDriverZip);

    // Windows-specific!
    // Overwrite existing drivers and selenium server.
    unzip(chromeDriverZip);
    unzip(ieDriverZip);
}

downloadAndInstallSeleniumAndDrivers();
downloadAndInstallSonar();

var chromeDriverExe = new File(tmp, "chromedriver.exe");

println("Remember to pass the webdriver.chrome.driver and/or webdriver.ie.driver options to selenium-server-standalone.jar");
println("  (bin/start-selenium.bat script shows you how)");
