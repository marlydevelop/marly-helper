# Marly Helper: second texture engine for Texture Tool Kit. Uses CodeWalker.Core.dll (bin/mhconv, the same library as the XML converter)
# to edit the texture dictionary inside .ypt (particles) and .ytd files, including newer files that the old RageLib cannot read.
# Same commands and JSON result format as ttk.ps1: list, export, apply. Result is written as JSON (UTF-8) to -Out.
param(
  [Parameter(Mandatory = $true)][string]$Cmd,
  [string]$Target = '',
  [string]$ArgsFile = '',
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$Root = $PSScriptRoot,
  [string]$CwDir = ''
)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Done($o) { [IO.File]::WriteAllText($Out, (ConvertTo-Json -InputObject $o -Depth 8 -Compress), $utf8) }
function Prop($o, $n) { $p = $o.GetType().GetProperty($n); if ($null -eq $p) { return $null }; return $p.GetValue($o, $null) }
function SetProp($o, $n, $v) { $o.GetType().GetProperty($n).SetValue($o, $v, $null) }
function Unwrap($ex) { while ($ex.InnerException) { $ex = $ex.InnerException }; return $ex }
function Unblock($dir) { try { if ($dir -and (Test-Path -LiteralPath $dir)) { Get-ChildItem -LiteralPath $dir -Recurse -File -Include *.dll, *.exe -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue } } catch { } }
# Files taken from a downloaded zip carry the "from the internet" mark; .NET refuses LoadFrom for them. Unblock, and as a fallback load the bytes.
function LoadAsm($p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([IO.File]::ReadAllBytes($p)) } }
function Items($o) { $v = Prop $o 'data_items'; if ($null -eq $v) { return , @() }; return , @($v) }

function TexName($t) {
  $n = [string](Prop $t 'Name')
  if ([string]::IsNullOrEmpty($n)) { $n = ('hash_{0:X8}' -f [uint32](Prop $t 'NameHash')) }
  return $n
}
function Describe($td, $dname) {
  $tex = @()
  $i = 0
  foreach ($t in (Items (Prop $td 'Textures'))) {
    $f = 'UNKNOWN'; $wd = 0; $ht = 0; $lv = 0; $nm = ''
    try { $f = ([string](Prop $t 'Format')) -replace '^D3DFMT_', '' } catch { }
    try { $wd = [int](Prop $t 'Width') } catch { }
    try { $ht = [int](Prop $t 'Height') } catch { }
    try { $lv = [int](Prop $t 'Levels') } catch { }
    try { $nm = TexName $t } catch { }
    if (-not $nm) { $nm = 'texture_' + $i }
    $tex += @{ i = $i; name = $nm; w = $wd; h = $ht; levels = $lv; mips = $lv; format = $f }
    $i++
  }
  return , @(@{ d = 0; name = $dname; textures = $tex })
}

try {
  if (-not (Test-Path -LiteralPath $Target)) { Done @{ ok = $false; error = 'not-found' }; exit 4 }
  if (-not $CwDir -or -not (Test-Path -LiteralPath (Join-Path $CwDir 'CodeWalker.Core.dll'))) { Done @{ ok = $false; error = 'fail'; message = 'CodeWalker.Core.dll not found' }; exit 5 }
  Unblock $CwDir
  Set-Location -LiteralPath $CwDir
  [Environment]::CurrentDirectory = $CwDir
  $sb = {
    param($sender, $e)
    $n = ($e.Name -split ',')[0]
    $p = Join-Path $CwDir ($n + '.dll')
    if (Test-Path -LiteralPath $p) { try { return [System.Reflection.Assembly]::LoadFrom($p) } catch { return [System.Reflection.Assembly]::Load([System.IO.File]::ReadAllBytes($p)) } }
    return $null
  }.GetNewClosure()
  [AppDomain]::CurrentDomain.add_AssemblyResolve([System.ResolveEventHandler]$sb)

  $asm = LoadAsm (Join-Path $CwDir 'CodeWalker.Core.dll')
  $tDds = $asm.GetType('CodeWalker.Utils.DDSIO', $true)
  $tJenk = $asm.GetType('CodeWalker.GameFiles.JenkHash', $true)
  $mHash = $tJenk.GetMethod('GenHash', [Type[]]@([string]))
  $mGetDds = $tDds.GetMethod('GetDDSFile')
  $mGetTex = $tDds.GetMethod('GetTexture')

  $ext = [IO.Path]::GetExtension($Target).ToLowerInvariant()
  $bytes = [IO.File]::ReadAllBytes($Target)
  $file = $null; $td = $null; $dname = [IO.Path]::GetFileNameWithoutExtension($Target)
  if ($ext -eq '.ypt') {
    $file = [Activator]::CreateInstance($asm.GetType('CodeWalker.GameFiles.YptFile', $true))
    [void]$file.GetType().GetMethod('Load', [Type[]]@([byte[]])).Invoke($file, [object[]]@(, $bytes))
    $pl = Prop $file 'PtfxList'
    if ($null -eq $pl) { throw ('ypt could not be read: ' + [string](Prop $file 'ErrorMessage')) }
    $td = Prop $pl 'TextureDictionary'
    $pn = [string](Prop $pl 'Name'); if ($pn) { $dname = $pn }
  } elseif ($ext -eq '.ytd') {
    $file = [Activator]::CreateInstance($asm.GetType('CodeWalker.GameFiles.YtdFile', $true))
    [void]$file.GetType().GetMethod('Load', [Type[]]@([byte[]])).Invoke($file, [object[]]@(, $bytes))
    $td = Prop $file 'TextureDict'
  } else { throw 'Unsupported file type.' }
  if ($null -eq $td -or $null -eq (Prop $td 'Textures')) { throw 'This file has no texture dictionary.' }

  $a = $null
  if ($ArgsFile) { $a = Get-Content -LiteralPath $ArgsFile -Raw -Encoding UTF8 | ConvertFrom-Json }
  $cur = Items (Prop $td 'Textures')

  switch ($Cmd) {
    'list' {
      Done @{ ok = $true; type = $ext.Substring(1).ToUpperInvariant(); dicts = (Describe $td $dname) }
    }
    'export' {
      $ok = @(); $failed = @()
      foreach ($it in @($a.items)) {
        try {
          $t = $cur[[int]$it.i]
          if ((TexName $t) -ne [string]$it.name) { throw 'name mismatch' }
          $dds = $mGetDds.Invoke($null, [object[]]@($t))
          if ($null -eq $dds) { throw 'texture could not be converted to DDS' }
          [IO.File]::WriteAllBytes([string]$it.path, [byte[]]$dds)
          $ok += [int]$it.i
        } catch { $failed += @{ name = [string]$it.name; message = [string](Unwrap $_.Exception).Message } }
      }
      Done @{ ok = $true; exported = $ok; failed = $failed }
    }
    'apply' {
      $tTex = $asm.GetType('CodeWalker.GameFiles.Texture', $true)
      $work = [Activator]::CreateInstance(([type]'System.Collections.Generic.List`1').MakeGenericType($tTex))
      foreach ($t in $cur) { $work.Add($t) }
      $snap = $cur
      $done = 0; $failed = @()
      foreach ($op in @($a.ops)) {
        try {
          if ($op.op -eq 'add') {
            $dds = [IO.File]::ReadAllBytes([string]$op.path)
            $nt = $mGetTex.Invoke($null, [object[]]@(, $dds))
            if ($null -eq $nt) { throw 'DDS could not be read' }
            $nm = [string]$op.name; if (-not $nm) { $nm = [IO.Path]::GetFileNameWithoutExtension([string]$op.path) }
            SetProp $nt 'Name' $nm
            SetProp $nt 'NameHash' ([uint32]$mHash.Invoke($null, [object[]]@($nm.ToLowerInvariant())))
            try { $pu = $nt.GetType().GetProperty('Usage'); $pu.SetValue($nt, [Enum]::Parse($pu.PropertyType, 'DEFAULT'), $null) } catch { }
            $work.Add($nt)
          } else {
            $t = $snap[[int]$op.i]
            if ((TexName $t) -ne [string]$op.name) { throw 'name mismatch' }
            if ($op.op -eq 'replace') {
              $dds = [IO.File]::ReadAllBytes([string]$op.path)
              $nt = $mGetTex.Invoke($null, [object[]]@(, $dds))
              if ($null -eq $nt) { throw 'DDS could not be read' }
              foreach ($pn in @('Data', 'Width', 'Height', 'Depth', 'Levels', 'Format', 'Stride')) { SetProp $t $pn (Prop $nt $pn) }
            } elseif ($op.op -eq 'delete') {
              [void]$work.Remove($t)
            } else { throw 'bad op' }
          }
          $done++
        } catch { $failed += @{ op = [string]$op.op; name = [string]$op.name; message = [string](Unwrap $_.Exception).Message } }
      }
      if ($done -gt 0) {
        [void]$td.GetType().GetMethod('BuildFromTextureList').Invoke($td, [object[]]@(, $work))
        $saved = $file.GetType().GetMethod('Save', [Type[]]@()).Invoke($file, $null)
        if ($null -eq $saved -or $saved.Length -eq 0) { throw 'the file could not be built' }
        [IO.File]::WriteAllBytes($Target, [byte[]]$saved)
      }
      Done @{ ok = $true; done = $done; failed = $failed; dicts = (Describe $td $dname) }
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
