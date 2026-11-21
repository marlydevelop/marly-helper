@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js not found. Install Node.js LTS from nodejs.org and run again.
  pause
  exit /b 1
)
if not exist "node_modules\electron\dist\electron.exe" (
  if exist node_modules rmdir /s /q node_modules
  call npm install
  if errorlevel 1 (
    echo npm install failed.
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
if not exist "bin\vtracer.exe" call get-vtracer.bat nopause
if not exist "bin\vtracer.exe" (
  echo bin\vtracer.exe not found. Run get-vtracer.bat first.
  pause
  exit /b 1
)
call npm run dist
echo.
echo Done. See the dist folder.
pause
