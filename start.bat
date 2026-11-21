@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js LTS from nodejs.org and run again.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  echo Installing dependencies, please wait...
  if exist node_modules rmdir /s /q node_modules
  call npm install
  if errorlevel 1 (
    echo.
    echo npm install failed. Check your internet connection and run again.
    pause
    exit /b 1
  )
)
if not exist "node_modules\onnxruntime-node\package.json" (
  echo Installing dependencies, please wait...
  call npm install
  if errorlevel 1 (
    echo npm install failed. Check your internet connection and run again.
    pause
    exit /b 1
  )
)
rem close leftover app processes from a previous run
powershell -NoProfile -Command "if (Test-Path ('\\.\pipe\marly-helper-explorer-' + $env:USERNAME)) { exit 1 } else { exit 0 }" >nul 2>nul
if errorlevel 1 (
  echo RPF Explorer window is open, leaving running processes alone.
) else (
  taskkill /f /im electron.exe >nul 2>nul
)
start "" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0."
exit /b 0
