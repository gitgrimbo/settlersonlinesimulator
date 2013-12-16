REM Run from anywhere, project root or bin folder. E.g. (from root):
REM   bin\kill-drivers
tasklist | find /i "driver" && taskkill /f /im "chromedriver.exe" && taskkill /f /im "IEDriverServer.exe"