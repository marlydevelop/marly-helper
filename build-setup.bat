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
  call npm install
  if errorlevel 1 (
    echo npm install failed.
    pause
    exit /b 1
  )
)
if not exist "installer\node_modules\electron\dist\electron.exe" (
  if exist installer\node_modules rmdir /s /q installer\node_modules
  pushd installer
  call npm install
  popd
  if not exist "installer\node_modules\electron\dist\electron.exe" (
    echo installer npm install failed.
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
echo.
echo [1/3] Building the app...
call npm run dist:dir
if errorlevel 1 (
  echo App build failed.
  pause
  exit /b 1
)
echo.
echo [2/3] Preparing installer payload...
node installer\prepare.js
if errorlevel 1 (
  pause
  exit /b 1
)
echo.
echo [3/3] Building installer (this takes a while)...
pushd installer
call npm run dist
popd
if errorlevel 1 (
  echo Installer build failed.
  pause
  exit /b 1
)
echo.
echo Done. Installer: installer\dist\Marly-Helper-Setup-*.exe
pause
