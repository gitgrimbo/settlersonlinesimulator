@echo off

REM Follow these instructions to install Node and requirejs
REM http://requirejs.org/docs/optimization.html#download
REM npm install -g requirejs
REM npm install -g almond

REM We use requirejs's "r.js" to do the build, and almondjs for the lightweight AMD loading.

REM Set paths for modules you expect to be loaded by the page, or by a CDN, to "empty:"
REM   http://requirejs.org/docs/optimization.html#empty

REM r.js.cmd is the npm globally installed r.js command file.

r.js.cmd -o baseUrl=../src name=../chrome/almond include=../chrome/main out=../all.js wrap=true optimize=none paths.jquery=empty:

REM ----------
REM Sample output:

REM d:\dev\git_repos\grimbo-bookmarklets\bookmarklets\settlersonlinesimulator.com\chrome>build.bat
REM 
REM Tracing dependencies for: chrome/almond
REM 
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/all.js
REM ----------------
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/chrome/almond.js
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/adventures-page.js
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/units-required.js
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/full-adventure-info.js
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/sort-adventures.js
REM d:/dev/git_repos/grimbo-bookmarklets/bookmarklets/settlersonlinesimulator.com/chrome/main.js
