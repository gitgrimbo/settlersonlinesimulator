@echo off
REM Run from anywhere, project root or bin folder. E.g. (from root):
REM   bin\kill-drivers
tasklist | findstr /i "driver phantomjs"
taskkill /f /im "chromedriver.exe"
taskkill /f /im "IEDriverServer.exe"
taskkill /f /im "phantomjs.exe"