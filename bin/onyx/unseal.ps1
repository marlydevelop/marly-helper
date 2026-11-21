# Marly Helper: "Raspechatat" (unseal RPF). Calls the ONYX RPF UTILITY engine (ArchiveTool.Models.MainModel) without its window.
# Must run in 32-bit PowerShell (ONYX is an x86 .NET Framework assembly). Prints one JSON line at the end.
param(
  [Parameter(Mandatory = $true)][string]$Rpf,
  [string]$Root = $PSScriptRoot,
  [string]$Log = ''
)
$ErrorActionPreference = 'Stop'
function Emit($o) { [Console]::Out.WriteLine(($o | ConvertTo-Json -Compress)) }
function Prop($o, $n) { $p = $o.GetType().GetProperty($n); if ($null -eq $p) { return $null }; return $p.GetValue($o, $null) }
function Unblock($dir) { try { if ($dir -and (Test-Path -LiteralPath $dir)) { Get-ChildItem -LiteralPath $dir -Recurse -File -Include *.dll, *.exe -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue } } catch { } }
# Files taken from a downloaded zip carry the "from the internet" mark; .NET refuses LoadFrom for them. Unblock, and as a fallback load the bytes.
function LoadAsm($p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([IO.File]::ReadAllBytes($p)) } }
function Dispose-Model($m) { try { $mm = $m.GetType().GetMethod('Close'); if ($mm) { [void]$mm.Invoke($m, $null) } } catch { } }
try {
  if ([IntPtr]::Size -ne 4) { Emit @{ ok = $false; error = 'fail'; message = 'need 32-bit PowerShell' }; exit 3 }
  if (-not (Test-Path -LiteralPath $Rpf)) { Emit @{ ok = $false; error = 'not-found' }; exit 4 }
  Unblock $Root
  Set-Location -LiteralPath $Root
  [Environment]::CurrentDirectory = $Root
  $lib = Join-Path $Root 'lib'
  $env:PATH = $lib + ';' + $env:PATH
  $sb = {
    param($sender, $e)
    $n = ($e.Name -split ',')[0]
    foreach ($d in @($lib, $Root)) {
      $p = Join-Path $d ($n + '.dll')
      if (Test-Path -LiteralPath $p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([System.IO.File]::ReadAllBytes($p)) } }
    }
    return $null
  }.GetNewClosure()
  [AppDomain]::CurrentDomain.add_AssemblyResolve([System.ResolveEventHandler]$sb)

  $asm = LoadAsm (Join-Path $Root 'ONYX RPF UTILITY.exe')
  $tModel = $asm.GetType('ArchiveTool.Models.MainModel', $true)
  if ($Log) { try { $tLog = $asm.GetType('ArchiveTool.Helpers.Logger'); [void]$tLog.GetMethod('SetLogFile').Invoke($null, @($Log)) } catch { } }

  $m = [Activator]::CreateInstance($tModel)
  if (-not (Prop $m 'HasKeys')) { Emit @{ ok = $false; error = 'keys' }; exit 5 }
  $an = $tModel.GetMethod('AnalyzeProtection').Invoke($m, @($Rpf))
  Dispose-Model $m
  if (-not [bool](Prop $an 'IsProtected')) { Emit @{ ok = $true; changed = $false }; exit 0 }
  $type = [string](Prop $an 'ProtectionTypeName')

  $m1 = [Activator]::CreateInstance($tModel)
  [void]$tModel.GetMethod('UnlockArchive').Invoke($m1, @($Rpf))
  Dispose-Model $m1

  $m2 = [Activator]::CreateInstance($tModel)
  $an2 = $tModel.GetMethod('AnalyzeProtection').Invoke($m2, @($Rpf))
  Dispose-Model $m2
  Emit @{ ok = $true; changed = $true; type = $type; stillProtected = [bool](Prop $an2 'IsProtected') }
  exit 0
}
catch {
  $ex = $_.Exception
  while ($ex.InnerException) { $ex = $ex.InnerException }
  Emit @{ ok = $false; error = 'fail'; message = [string]$ex.Message }
  exit 1
}
