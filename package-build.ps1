#!/usr/bin/env pwsh

# iFlow Desktop 打包脚本
# 将构建产物打包为单独的 zip 文件

$ErrorActionPreference = "Stop"

Write-Host "📦 开始打包 iFlow Desktop..." -ForegroundColor Green

# 设置路径
$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BuildOutput = Join-Path $ProjectRoot "src-tauri\target\release\bundle"
$PackageDir = Join-Path $ProjectRoot "packages"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$PackageName = "iflow-desktop-$Timestamp"

# 检查构建输出是否存在
if (-not (Test-Path $BuildOutput)) {
    Write-Host "❌ 构建输出目录不存在，请先运行：npm run tauri build" -ForegroundColor Red
    exit 1
}

# 创建打包目录
if (Test-Path $PackageDir) {
    Remove-Item -Path $PackageDir -Recurse -Force
}
New-Item -ItemType Directory -Path $PackageDir | Out-Null

# 收集所有构建产物
$PackageFiles = @()
if (Test-Path (Join-Path $BuildOutput "msi")) {
    $PackageFiles += Get-ChildItem -Path (Join-Path $BuildOutput "msi") -Filter "*.msi"
}
if (Test-Path (Join-Path $BuildOutput "nsis")) {
    $PackageFiles += Get-ChildItem -Path (Join-Path $BuildOutput "nsis") -Filter "*.exe"
}
if (Test-Path (Join-Path $BuildOutput "dmg")) {
    $PackageFiles += Get-ChildItem -Path (Join-Path $BuildOutput "dmg") -Filter "*.dmg"
}
if (Test-Path (Join-Path $BuildOutput "macos")) {
    $PackageFiles += Get-ChildItem -Path (Join-Path $BuildOutput "macos") -Filter "*.app" -Recurse
}

if ($PackageFiles.Count -eq 0) {
    Write-Host "❌ 未找到任何构建产物" -ForegroundColor Red
    exit 1
}

Write-Host "📋 找到 $($PackageFiles.Count) 个文件:" -ForegroundColor Yellow
foreach ($file in $PackageFiles) {
    Write-Host "   - $($file.Name)" -ForegroundColor Gray
}

# 创建临时目录用于打包
$TempDir = Join-Path $PackageDir "temp"
New-Item -ItemType Directory -Path $TempDir | Out-Null

# 复制文件到临时目录
foreach ($file in $PackageFiles) {
    if ($file.PSIsContainer) {
        Copy-Item -Path $file.FullName -Destination $TempDir -Recurse
    } else {
        Copy-Item -Path $file.FullName -Destination $TempDir
    }
}

# 创建 README 文件
$ReadmeContent = @"
iFlow Desktop 安装包
====================

版本信息:
- 打包时间：$(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- 包含文件：$($PackageFiles.Count) 个

安装说明:
----------
Windows:
  - 双击 .msi 文件进行安装 (推荐)
  - 或运行 .exe 安装程序

macOS:
  - 打开 .dmg 文件
  - 拖动 .app 到 Applications 文件夹

文件列表:
----------
$($PackageFiles | ForEach-Object { "- $($_.Name)" } | Out-String)

GitHub: https://github.com/XY-JX/iflow-desktop
"@

Set-Content -Path (Join-Path $TempDir "README.txt") -Value $ReadmeContent -Encoding UTF8

# 压缩为 zip 文件
$ZipPath = Join-Path $PackageDir "$PackageName.zip"
Compress-Archive -Path (Join-Path $TempDir "*") -DestinationPath $ZipPath -Force

# 清理临时目录
Remove-Item -Path $TempDir -Recurse -Force

Write-Host "✅ 打包完成！" -ForegroundColor Green
Write-Host "📦 输出文件：$ZipPath" -ForegroundColor Cyan
Write-Host "📊 文件大小：$([math]::Round((Get-Item $ZipPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
