@echo off
REM Run from anywhere, project root or bin folder. E.g. (from root):
REM   bin\kill-drivers
call tasklist | findstr /i "driver phantomjs"
call taskkill /f /im "chromedriver.exe"
call taskkill /f /im "IEDriverServer.exe"
call taskkill /f /im "phantomjs.exe"

exit /b 0
