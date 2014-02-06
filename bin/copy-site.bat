@echo off

xcopy /s /i /y target\site\* ..\settlersonlinesimulator.pages

echo **************************************************
echo REMEMBER TO DELETE ALL THE CONTENT FROM THE SITE REPO FIRST
echo          SO THAT ONLY LATEST CONTENT REMAINS
echo **************************************************
