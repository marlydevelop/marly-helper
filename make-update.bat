@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js LTS from nodejs.org and run again.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" call npm install
if not exist "bin\vtracer.exe" call get-vtracer.bat nopause
echo Building the app...
call npm run dist:dir
if errorlevel 1 (
  echo App build failed.
  pause
  exit /b 1
)
node tools\make-update.js
if errorlevel 1 (
  pause
  exit /b 1
)
echo.
pause
