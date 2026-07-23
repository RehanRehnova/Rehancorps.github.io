# Build Passfill zip for site download (Chrome + Firefox same package)
# Always includes LICENSE + COPYRIGHT.
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$repo = Split-Path -Parent $root
$manifest = Get-Content (Join-Path $root "manifest.json") -Raw | ConvertFrom-Json
$ver = $manifest.version
$outRoot = Join-Path $repo "rehnova-passfill-$ver.zip"
$outStaticDir = Join-Path $repo "static\downloads"
$outStatic = Join-Path $outStaticDir "rehnova-passfill.zip"
$outLegacy = Join-Path $outStaticDir "rehnova-vault.zip"

if (-not (Test-Path $outStaticDir)) {
  New-Item -ItemType Directory -Path $outStaticDir | Out-Null
}

foreach ($required in @("LICENSE", "COPYRIGHT", "manifest.json")) {
  if (-not (Test-Path (Join-Path $root $required))) {
    throw "Missing required file: $required - refuse to pack without license."
  }
}

$stage = Join-Path $env:TEMP "rehnova-passfill-pack-$ver"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$include = @(
  "manifest.json",
  "config.js",
  "background.js",
  "content.js",
  "content.css",
  "popup.html",
  "popup.js",
  "popup.css",
  "privacy.html",
  "README.md",
  "LICENSE",
  "COPYRIGHT",
  "lib",
  "icons"
)

foreach ($item in $include) {
  $src = Join-Path $root $item
  if (-not (Test-Path $src)) { Write-Warning "missing $item"; continue }
  $dest = Join-Path $stage $item
  if (Test-Path $src -PathType Container) {
    Copy-Item $src $dest -Recurse
  } else {
    Copy-Item $src $dest
  }
}

foreach ($p in @($outRoot, $outStatic, $outLegacy)) {
  if (Test-Path $p) { Remove-Item $p -Force }
}

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $outRoot -Force
Copy-Item $outRoot $outStatic -Force
Copy-Item $outRoot $outLegacy -Force
Remove-Item $stage -Recurse -Force

Copy-Item (Join-Path $root "privacy.html") (Join-Path $outStaticDir "passfill-privacy.html") -Force
Copy-Item (Join-Path $root "privacy.html") (Join-Path $outStaticDir "vault-privacy.html") -Force
Copy-Item (Join-Path $root "LICENSE") (Join-Path $outStaticDir "passfill-LICENSE.txt") -Force

Write-Host ""
Write-Host "OK  $outStatic  (v$ver + LICENSE)"
Write-Host "OK  $outRoot"
Write-Host "Install page: /passfill  or  /vault"
Write-Host ""
