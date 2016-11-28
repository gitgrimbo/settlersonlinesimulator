This project contains JavaScript to enhance the http://settlersonlinesimulator.com/ website.

Project documentation is available at http://gitgrimbo.github.io/settlersonlinesimulator/.

## Getting Started

Clone the repo.

    git clone https://github.com/gitgrimbo/settlersonlinesimulator.git

All of the commands from this point forward are assumed to be run from the repo root, unless otherwise stated.

Install Intern via npm (Intern is declared as a dependency in `package.json`).

    npm install

Run the setup script to download [Selenium](http://www.seleniumhq.org/download/),
[Selenium ChromeDriver](http://chromedriver.storage.googleapis.com/index.html),
[Selenium IEDriver](http://code.google.com/p/selenium/downloads/list),
[SonarQube](http://www.sonarqube.org/),
[SonarQube JavaScript plugin](http://docs.codehaus.org/display/SONAR/JavaScript+Plugin) to the
`tmp/` folder. These downloads will come to around 107Mb.
Sonar will be extracted so that its start script can be run later.

    bin\setup.bat

You should now be ready for testing and using Sonar for code quality.

## Editing

Just edit the files!

## Testing

The tests are written using [Jasmine](https://jasmine.github.io/).

### Manual

To run the tests manually, start a web server in the root directory (e.g. if using
[NanoHttpd](https://github.com/NanoHttpd/nanohttpd), `nano -p 80`) and browse to:

http://localhost/test/SpecRunner.html

### Selenium (standalone, not Grid)

This section is for standalone Selenium tests. By *standalone* we mean there is no Selenium Grid.
For the *standalone* tests, the Maven POM is configured to start Selenium locally and to only control browsers available to the local PC.

The standalone Selenium tests are run using the
[selenium-maven-plugin](http://mojo.codehaus.org/selenium-maven-plugin/) Maven plugin which is
declared in the `pom-selenium.xml` POM file.
There are lots of nasty overrides in this POM to force the plugin to use a later version of
Selenium (v2.38 rather than v2.21).

To run the tests via Selenium, run the `bin\integration-tests.bat` script. This script will use
Node to invoke Intern, and Intern will connect to Selenium and ask for the tests to be run.

A [custom Intern/Jasmine reporter](https://github.com/gitgrimbo/settlersonlinesimulator/blob/master/interntest/ReporterToHandleJasmineJunitReports.js)
has been written to pass the test results from the `SpecRunner.html` page to Intern, from where
Intern can write out the JUnit-format XML result files (i.e. `TEST-xxx.xml`) to `reports/junit/`.
These XML files will be processed later by the Maven Site plugin (to generate the junitreport
and Surefire report).

E.g. the files generated are:

(generated by Intern/Jasmine reporter - **old style**)

    reports\junit\TEST-AdventuresList-WINDOWS-internet explorer-9.xml
    reports\junit\TEST-AdventuresList-XP-chrome-31.0.1650.63.xml
    reports\junit\TEST-AdventuresList-XP-firefox-25.0.1.xml
    reports\junit\TEST-UnitsRequired-WINDOWS-internet explorer-9.xml
    reports\junit\TEST-UnitsRequired-XP-chrome-31.0.1650.63.xml
    reports\junit\TEST-UnitsRequired-XP-firefox-25.0.1.xml

(generated by Intern/Jasmine reporter - **new style - using [browserDetection.js](https://github.com/gitgrimbo/settlersonlinesimulator/blob/master/interntest/browser-detection.js) to give a more accurate O/S name**. See this issue for webdriver O/S (platform) reporting: [http://code.google.com/p/selenium/issues/detail?id=3354](http://code.google.com/p/selenium/issues/detail?id=3354))

    reports\junit\TEST-AdventuresList-Windows7-firefox-27.0.xml
    reports\junit\TEST-AdventuresList-Windows7-internet explorer-10.xml
    reports\junit\TEST-AdventuresList-Windows7-internet explorer-9.xml
    reports\junit\TEST-AdventuresList-WindowsXP-chrome-32.0.1700.107.xml
    reports\junit\TEST-AdventuresList-WindowsXP-firefox-26.0.xml

(generated by Intern/Istanbul - **directly into `/target`, so `mvn clean` will delete these!**)

    target\site\reports\istanbulhtml\index.html
    target\site\reports\istanbulhtml\prettify.css
    target\site\reports\istanbulhtml\prettify.js
    target\site\reports\istanbulhtml\src
    target\site\reports\istanbulhtml\src\adventures-model.js.html
    target\site\reports\istanbulhtml\src\console.js.html
    target\site\reports\istanbulhtml\src\context.js.html
    target\site\reports\istanbulhtml\src\index.html
    target\site\reports\istanbulhtml\src\string-utils.js.html
    target\site\reports\istanbulhtml\src\units-required
    target\site\reports\istanbulhtml\src\units-required\index.html
    target\site\reports\istanbulhtml\src\units-required\model.js.html
    target\site\reports\istanbulhtml\src\units-required\PageParser.js.html
    target\site\reports\istanbulhtml\src\units-required\SimTable.js.html

(the Ant junitreport files are generated during `mvn site`)

### Selenium Grid

Follow these steps (run all scripts from project root):

- Run `bin\start-selenium-hub.bat`. This will start the Selenium hub that will control the Grid.
- Run `bin\node-setup\node.bat`. This will start a Selenium node for the local PC. In the default case, this is configured with Firefox, Chrome and IE (see *capabilities* config file `Desktop_NodeWebDriver.json`).
- Selenium nodes:
 - Start Selenium nodes on each PC or VM that you want. I have been using XP+IE8 and Win7+IE10 [VirtualBox](https://www.virtualbox.org/) VMs from [modern.ie](http://modern.ie).
 - **And** I now use vSphere VMs on another machine to lessen the memory load on main PC (test runner).
- Run `bin\intern-tests.bat`

The final `intern-tests.bat` command will run the tests through Intern and will use the Selenium hub to distribute the tests to all nodes.

### Older browsers

Firefox 3.6 can be supported (at least for the tests, if not for the actual bookmarklet - as
the bookmarklet currently does not include the same shims as the tests) by adding the
following to the `<HEAD>` element of Intern's `client.html` runner:

    <script>
    if ("function" !== typeof Function.bind) {
        document.writeln('<script src="//rawgithub.com/es-shims/es5-shim/v2.3.0/es5-shim.js"></scr' + 'ipt>');
        document.writeln('<script src="//rawgithub.com/es-shims/es5-shim/v2.3.0/es5-sham.js"></scr' + 'ipt>');
    }
    if (!document.head) {
        document.head = document.getElementsByTagName("HEAD")[0];
    }
    </script>

The same fix will not work for IE8, as IE8 cannot support the shamming of `Object.create()` by
`es-sham.js`.

(*Alternatively, the Geezer branch of Intern could be used*)

## Sonar Code Quality

Start Sonar:

    start bin\sonar.bat

Run the Sonar Maven plugin:

    mvn sonar:sonar

## Building the Chrome Plugin

Building the Chrome plugin requires the
[requirejs Node module to be installed](http://requirejs.org/docs/optimization.html#download).
To build the Chrome plugin, `cd` into the `chrome/` folder and run `build.bat`.

A minified and non-minified version of the plugin will be built.

## Generating the Maven Site

In order to generate a full site, the integration tests must have been run.

Why? Because the integration tests generate reports ...

- [Ant junitreport](http://ant.apache.org/manual/Tasks/junitreport.html)
- [Istanbul code coverage](http://gotwarlost.github.io/istanbul/) (used by Intern)
- [Checkstyle report]() (Via an XSLT transformation of the `checkstyle.xml` report generated by
  the [jshint-maven-plugin](https://github.com/cjdev/jshint-mojo) Maven plugin).

... and these reports are copied by the integration test into the `target/site/` folder. (this means `mvn clean` will remove some reports so be warned!)

Once the integration tests have been run successfully, build the site as normal:

    mvn site

## Publishing the Maven Site

Create a clone of the project, but only the `gh-pages` branch, in the same parent folder as the
regular repo:

    git clone https://github.com/gitgrimbo/settlersonlinesimulator.git -b gh-pages settlersonlinesimulator.pages

After generating the site, copy the site from the regular repo to the 'pages' repo:

    xcopy /E /Y /I target\site ..\settlersonlinesimulator.pages

(this is available in the utility script `bin\copy-site.bat`.)

**But** before copying, you should delete the existing contents of `settlersonlinesimulator.pages` so that stale files are not left in the repo.

After commiting the changes, push the branch to GitHub.

    git push origin gh-pages
