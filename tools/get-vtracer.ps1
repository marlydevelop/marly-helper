# Downloads vtracer.exe (visioncortex/vtracer CLI 1.0.0-alpha.3, Windows x64) into -Dest after sha256 check.
# Same URL/sha256 as in svg.js.
param([string]$Dest = "bin")
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = 'https://github.com/visioncortex/vtracer/releases/download/1.0.0-alpha.3/vtracer-x86_64-pc-windows-msvc.zip'
$sha = '26fb07c440aa6dd0a9ac57a83db6ee2924ddf308bccf451e76b324bb61780dba'
$tmp = Join-Path $env:TEMP ('mh-vt-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $tmp | Out-Null
$zip = Join-Path $tmp 'vt.zip'
Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing
if ((Get-FileHash $zip -Algorithm SHA256).Hash.ToLower() -ne $sha) { throw 'sha256 mismatch' }
Expand-Archive -Path $zip -DestinationPath $tmp -Force
$exe = Get-ChildItem $tmp -Recurse -Filter 'vtracer*.exe' | Select-Object -First 1
if (-not $exe) { throw 'vtracer.exe not found in archive' }
New-Item -ItemType Directory -Path $Dest -Force | Out-Null
Copy-Item $exe.FullName (Join-Path $Dest 'vtracer.exe') -Force
Remove-Item $tmp -Recurse -Force
Write-Host "OK: $Dest\vtracer.exe"
