# 数据迁移脚本
# 将旧版本的用户数据迁移到安装目录

Write-Host "=== iFlow Desktop 数据迁移工具 ===" -ForegroundColor Cyan
Write-Host ""

# 获取用户AppData目录
$appDataDir = [Environment]::GetFolderPath("LocalApplicationData")
$oldConfigDir = Join-Path $appDataDir "iFlow Desktop\config"
$oldDataDir = Join-Path $appDataDir "iFlow Desktop\data"

# 获取当前脚本所在目录(安装目录)
$installDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$newConfigDir = Join-Path $installDir "config"
$newDataDir = Join-Path $installDir "data"

Write-Host "源目录 (AppData):" -ForegroundColor Yellow
Write-Host "  配置: $oldConfigDir" -ForegroundColor Gray
Write-Host "  数据: $oldDataDir" -ForegroundColor Gray
Write-Host ""
Write-Host "目标目录 (安装目录):" -ForegroundColor Yellow
Write-Host "  配置: $newConfigDir" -ForegroundColor Gray
Write-Host "  数据: $newDataDir" -ForegroundColor Gray
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $oldConfigDir) -and -not (Test-Path $oldDataDir)) {
    Write-Host "✓ 未找到旧版本数据,无需迁移" -ForegroundColor Green
    exit 0
}

# 创建目标目录
if (-not (Test-Path $newConfigDir)) {
    New-Item -ItemType Directory -Path $newConfigDir -Force | Out-Null
    Write-Host "✓ 创建配置目录: $newConfigDir" -ForegroundColor Green
}

if (-not (Test-Path $newDataDir)) {
    New-Item -ItemType Directory -Path $newDataDir -Force | Out-Null
    Write-Host "✓ 创建数据目录: $newDataDir" -ForegroundColor Green
}

# 迁移配置文件
$appConfigFile = Join-Path $oldConfigDir "app_config.json"
$appConfigTarget = Join-Path $newConfigDir "app_config.json"

if (Test-Path $appConfigFile) {
    if (Test-Path $appConfigTarget) {
        Write-Host "⚠ 应用配置已存在,跳过" -ForegroundColor Yellow
    } else {
        Copy-Item $appConfigFile $appConfigTarget
        Write-Host "✓ 迁移应用配置到config/" -ForegroundColor Green
    }
}

# 迁移TOTP数据到config目录
$totpFile = Join-Path $oldDataDir "totp_secrets.json"
$totpTarget = Join-Path $newConfigDir "totp_secrets.json"

if (Test-Path $totpFile) {
    if (Test-Path $totpTarget) {
        Write-Host "⚠ TOTP数据已存在,跳过" -ForegroundColor Yellow
    } else {
        Copy-Item $totpFile $totpTarget
        Write-Host "✓ 迁移TOTP数据到config/" -ForegroundColor Green
    }
}

# 迁移对话记录到data目录
$conversationsFile = Join-Path $oldConfigDir "conversations.json"
$conversationsTarget = Join-Path $newDataDir "conversations.json"

if (Test-Path $conversationsFile) {
    if (Test-Path $conversationsTarget) {
        Write-Host "⚠ 对话记录已存在,跳过" -ForegroundColor Yellow
    } else {
        Copy-Item $conversationsFile $conversationsTarget
        Write-Host "✓ 迁移对话记录到data/" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== 迁移完成 ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "1. 旧数据保留在 AppData 目录作为备份" -ForegroundColor Gray
Write-Host "2. 如需清理旧数据,请手动删除: $oldConfigDir" -ForegroundColor Gray
Write-Host "3. 确认新数据正常后,可安全删除旧数据" -ForegroundColor Gray
Write-Host ""
pause

