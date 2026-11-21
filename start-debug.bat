@echo off
cd /d "%~dp0"
taskkill /f /im electron.exe >nul 2>nul
call npm start
echo.
echo Exit code: %errorlevel%
echo Log file: %APPDATA%\marly-helper\log.txt
pause
