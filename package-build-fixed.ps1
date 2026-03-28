#!/usr/bin/env pwsh

# iFlow Desktop Packaging Script
# Packages build artifacts into a single zip file

$ErrorActionPreference = "Stop"

Write-Host "[iFlow Desktop] Starting packaging..." -ForegroundColor Cyan

# Set paths
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildOutput = Join-Path $ProjectRoot "src-tauri\target\release\bundle"
$PackageDir = Join-Path $ProjectRoot "packages"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$Version = "1.7.1"
$PackageName = "iflow-desktop-v$Version-$Timestamp"

# Check build output exists
Write-Host "[Check] Build output directory..." -ForegroundColor Yellow
if (-not (Test-Path $BuildOutput)) {
    Write-Host "[Error] Build output not found. Run: npm run tauri build" -ForegroundColor Red
    exit 1
}

# Create package directory
Write-Host "[Prepare] Creating package directory..." -ForegroundColor Yellow
if (Test-Path $PackageDir) {
    Remove-Item -Path $PackageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageDir | Out-Null

# Collect all build artifacts
$PackageFiles = @()
if (Test-Path (Join-Path $BuildOutput "msi")) {
    $MsiFiles = Get-ChildItem -Path (Join-Path $BuildOutput "msi") -Filter "*.msi"
    if ($MsiFiles.Count -gt 0) {
        $PackageFiles += $MsiFiles
        Write-Host "  [Found] MSI packages: $($MsiFiles.Count)" -ForegroundColor Gray
    }
}
if (Test-Path (Join-Path $BuildOutput "nsis")) {
    $NsisFiles = Get-ChildItem -Path (Join-Path $BuildOutput "nsis") -Filter "*.exe"
    if ($NsisFiles.Count -gt 0) {
        $PackageFiles += $NsisFiles
        Write-Host "  [Found] NSIS packages: $($NsisFiles.Count)" -ForegroundColor Gray
    }
}

if ($PackageFiles.Count -eq 0) {
    Write-Host "[Error] No build artifacts found" -ForegroundColor Red
    Write-Host "[Tip] Run 'npm run tauri build' first" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n[Summary] Found $($PackageFiles.Count) files:" -ForegroundColor Cyan
foreach ($file in $PackageFiles) {
    $SizeMB = [math]::Round($file.Length / 1MB, 2)
    Write-Host "  * $($file.Name) ($SizeMB MB)" -ForegroundColor Gray
}

# Create temp directory for packaging
Write-Host "`n[Operation] Preparing files..." -ForegroundColor Yellow
$TempDir = Join-Path $PackageDir "temp"
New-Item -ItemType Directory -Path $TempDir | Out-Null

# Copy files to temp directory
foreach ($file in $PackageFiles) {
    if ($file.PSIsContainer) {
        Copy-Item -Path $file.FullName -Destination $TempDir -Recurse
    } else {
        Copy-Item -Path $file.FullName -Destination $TempDir
    }
}

# Create README file
$ReadmeContent = @"
iFlow Desktop Installer
=======================

Version: v$Version
Packaged: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Files: $($PackageFiles.Count)

Installation:
- Windows: Run .exe installer

GitHub: https://github.com/XY-JX/iflow-desktop
"@

Set-Content -Path (Join-Path $TempDir "README.txt") -Value $ReadmeContent -Encoding UTF8
Write-Host "  [Generated] README.txt" -ForegroundColor Gray

# Compress to zip file
Write-Host "[Operation] Compressing..." -ForegroundColor Yellow
$ZipPath = Join-Path $PackageDir "$PackageName.zip"
Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $ZipPath -Force

# Cleanup temp directory
Remove-Item -Path $TempDir -Recurse -Force

# Output results
$FileSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "`n[Success] Packaging complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor DarkGray
Write-Host "Output: $ZipPath" -ForegroundColor Cyan
Write-Host "Size: $FileSize MB" -ForegroundColor Cyan
Write-Host "File: $PackageName.zip" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor DarkGray
