# Home

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

See [Testing](testing.html).

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

See [Site](site.html).
