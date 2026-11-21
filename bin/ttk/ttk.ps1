# Marly Helper: Texture Tool Kit engine host. Loads TextureTool.exe (Texture Toolkit by Neodymium, MIT) and calls its model classes without the window.
# Must run in 32-bit PowerShell (the program and RageLib/DirectXTex are x86). Result is written as JSON (UTF-8) to -Out.
param(
  [Parameter(Mandatory = $true)][string]$Cmd,
  [string]$Target = '',
  [string]$ArgsFile = '',
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$Root = $PSScriptRoot
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Done($o) { [IO.File]::WriteAllText($Out, (ConvertTo-Json -InputObject $o -Depth 8 -Compress), $utf8) }
function Prop($o, $n) { $p = $o.GetType().GetProperty($n); if ($null -eq $p) { return $null }; return $p.GetValue($o, $null) }
function SetProp($o, $n, $v) { $o.GetType().GetProperty($n).SetValue($o, $v, $null) }
function Call($o, $n, $a) { $m = $o.GetType().GetMethod($n); if ($null -eq $m) { throw ('no method ' + $n) }; return $m.Invoke($o, [object[]]$a) }
function Unwrap($ex) { while ($ex.InnerException) { $ex = $ex.InnerException }; return $ex }
function Unblock($dir) { try { if ($dir -and (Test-Path -LiteralPath $dir)) { Get-ChildItem -LiteralPath $dir -Recurse -File -Include *.dll, *.exe -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue } } catch { } }
# Files taken from a downloaded zip carry the "from the internet" mark; .NET refuses LoadFrom for them. Unblock, and as a fallback load the bytes.
function LoadAsm($p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([IO.File]::ReadAllBytes($p)) } }

function Describe($main) {
  $res = @()
  $di = 0
  foreach ($d in (Prop $main 'TextureDictionaries')) {
    $tex = @()
    $ti = 0
    foreach ($t in (Prop $d 'Textures')) {
      # each property is read separately: RageLib throws "not implemented" for formats it does not know, that must not break the whole list
      $nm = ''; $w = $null; $wd = 0; $ht = 0; $lv = 0; $mm = 0; $fm = 'UNKNOWN'
      try { $nm = [string](Prop $t 'Name') } catch { }
      if (-not $nm) { $nm = 'texture_' + $ti }
      try { $w = Prop $t 'Texture' } catch { }
      if ($null -ne $w) {
        try { $wd = [int](Prop $w 'Width') } catch { }
        try { $ht = [int](Prop $w 'Height') } catch { }
        try { $lv = [int](Prop $w 'Levels') } catch { }
        try { $mm = [int](Prop $w 'MipMapLevels') } catch { }
        try { $fm = [string](Prop $w 'Format') } catch { }
      }
      $tex += @{ i = $ti; name = $nm; w = $wd; h = $ht; levels = $lv; mips = $mm; format = $fm }
      $ti++
    }
    $res += @{ d = $di; name = [string](Prop $d 'Name'); textures = $tex }
    $di++
  }
  return , $res
}

try {
  if ([IntPtr]::Size -ne 4) { Done @{ ok = $false; error = 'fail'; message = 'need 32-bit PowerShell' }; exit 3 }
  if (-not (Test-Path -LiteralPath $Target)) { Done @{ ok = $false; error = 'not-found' }; exit 4 }
  Unblock $Root
  Set-Location -LiteralPath $Root
  [Environment]::CurrentDirectory = $Root
  $env:PATH = $Root + ';' + $env:PATH
  try {
    Add-Type -Namespace MH -Name Native -MemberDefinition '[DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)] public static extern bool SetDllDirectory(string path);'
    [void][MH.Native]::SetDllDirectory($Root)
  } catch { }
  $sb = {
    param($sender, $e)
    $n = ($e.Name -split ',')[0]
    $p = Join-Path $Root ($n + '.dll')
    if (Test-Path -LiteralPath $p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([System.IO.File]::ReadAllBytes($p)) } }
    return $null
  }.GetNewClosure()
  [AppDomain]::CurrentDomain.add_AssemblyResolve([System.ResolveEventHandler]$sb)

  $asm = LoadAsm (Join-Path $Root 'TextureTool.exe')
  $tMain = $asm.GetType('TextureTool.Models.MainModel', $true)
  $main = [Activator]::CreateInstance($tMain)
  [void](Call $main 'Load' @($Target))

  $a = $null
  if ($ArgsFile) { $a = Get-Content -LiteralPath $ArgsFile -Raw -Encoding UTF8 | ConvertFrom-Json }
  $dm = @(Prop $main 'TextureDictionaries')

  switch ($Cmd) {
    'list' {
      Done @{ ok = $true; type = [string](Prop $main 'FileType'); dicts = (Describe $main) }
    }
    'export' {
      $ok = @(); $failed = @()
      foreach ($it in @($a.items)) {
        try {
          $tm = @(Prop $dm[[int]$it.d] 'Textures')[[int]$it.i]
          if ([string](Prop $tm 'Name') -ne [string]$it.name) { throw 'name mismatch' }
          [void](Call $tm 'Export' @([string]$it.path))
          $ok += [int]$it.i
        } catch { $failed += @{ name = [string]$it.name; message = [string](Unwrap $_.Exception).Message } }
      }
      Done @{ ok = $true; exported = $ok; failed = $failed }
    }
    'apply' {
      $snap = @{}
      $done = 0; $failed = @()
      foreach ($op in @($a.ops)) {
        try {
          $d = [int]$op.d
          $dict = $dm[$d]
          if ($op.op -eq 'add') {
            [void](Call $dict 'Import' @([string]$op.path, $false))
          } else {
            if (-not $snap.ContainsKey($d)) { $snap[$d] = @(Prop $dict 'Textures') }
            $tm = $snap[$d][[int]$op.i]
            $nm = [string](Prop $tm 'Name')
            if ($nm -ne [string]$op.name) { throw 'name mismatch' }
            if ($op.op -eq 'replace') {
              [void](Call $tm 'Import' @([string]$op.path))
              if ([string](Prop $tm 'Name') -ne $nm) { SetProp $tm 'Name' $nm }
            } elseif ($op.op -eq 'delete') {
              [void](Call $dict 'Delete' @($tm))
            } else { throw 'bad op' }
          }
          $done++
        } catch { $failed += @{ op = [string]$op.op; name = [string]$op.name; message = [string](Unwrap $_.Exception).Message } }
      }
      if ($done -gt 0) { [void](Call $main 'Save' @($Target)) }
      Done @{ ok = $true; done = $done; failed = $failed; dicts = (Describe $main) }
    }
    default { Done @{ ok = $false; error = 'fail'; message = 'bad command' } }
  }
  exit 0
}
catch {
  $ex = Unwrap $_.Exception
  $st = ''; try { $st = (([string]$ex.StackTrace) -split "`n" | Select-Object -First 4 | ForEach-Object { $_.Trim() }) -join ' | ' } catch { }
  Done @{ ok = $false; error = 'fail'; message = [string]$ex.Message; type = $ex.GetType().Name; stack = $st }
  exit 1
}
