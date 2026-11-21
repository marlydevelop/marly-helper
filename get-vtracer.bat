@echo off
cd /d "%~dp0"
echo Downloading vtracer.exe (github.com/visioncortex/vtracer) ...
powershell -NoProfile -ExecutionPolicy Bypass -File tools\get-vtracer.ps1 -Dest bin
if errorlevel 1 (
  echo Download failed. Download vtracer-x86_64-pc-windows-msvc.zip from github.com/visioncortex/vtracer/releases and put vtracer.exe into the bin folder.
  pause
  exit /b 1
)
if "%~1"=="" pause
