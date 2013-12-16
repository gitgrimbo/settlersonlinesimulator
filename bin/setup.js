/*

Run using jrunscript from project root. E.g.:
  jrunscript bin\setup.js

Downloads selenium server and chrome driver and ie driver into ./tmp

Unpacks chrome driver and ie driver.

NOTE! Uses Windows-specific commands such as 'cmd' and 'copy'.

*/

// CONFIG

// config for the script
var config = {
    seleniumserver: {
        url: "http://selenium.googlecode.com/files/selenium-server-standalone-2.38.0.jar"
    },
    chromedriver: {
        url: "http://chromedriver.storage.googleapis.com/2.7/chromedriver_win32.zip"
    },
    iedriver: {
        url: "https://selenium.googlecode.com/files/IEDriverServer_Win32_2.38.0.zip"
    }
};

// If you have local copies of the required files, set them here and set useLocal=true.
var useLocal = true;
if (useLocal) {
    config.seleniumserver.url = "file:///X:/backup/apps/dev/testing/selenium-server-standalone-2.38.0.jar";
    config.chromedriver.url = "file:///X:/backup/apps/dev/testing/chromedriver/2.7/chromedriver_win32.zip";
    config.iedriver.url = "file:///X:/backup/apps/dev/testing/iedriver/IEDriverServer_Win32_2.38.0.zip";
}

// IMPORTS

importClass(java.lang.System);
importPackage(java.io);
importPackage(java.net);
importPackage(java.nio.channels);
importPackage(java.util);

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




// START

var f = new File(".");
var tmp = new File(f, "tmp");

tmp.mkdirs();

var chromeDriverZip = new File(tmp, urlFilename(config.chromedriver.url));
var ieDriverZip = new File(tmp, urlFilename(config.iedriver.url));
var seleniumJar = new File(tmp, urlFilename(config.seleniumserver.url));

maybeDownload(config.seleniumserver.url, seleniumJar);
maybeDownload(config.chromedriver.url, chromeDriverZip);
maybeDownload(config.iedriver.url, ieDriverZip);

// Windows-specific!
exec('cmd /c cd tmp && jar xvf ' + chromeDriverZip.getName());
exec('cmd /c cd tmp && jar xvf ' + ieDriverZip.getName());
exec('cmd /c cd tmp && copy ' + seleniumJar.getName() + ' selenium-server-standalone.jar');

var chromeDriverExe = new File(tmp, "chromedriver.exe");

println('Now you MAYBE need to add chromedriver and/or iedriver to PATH (if it is not already there).');
println("This is not required if you pass the webdriver.chrome.driver and/or webdriver.ie.driver options to selenium-server-standalone.jar");
println('E.g.');
println('SET PATH=%PATH%' + System.getProperty("path.separator") + chromeDriverExe.getParentFile().getAbsolutePath());
