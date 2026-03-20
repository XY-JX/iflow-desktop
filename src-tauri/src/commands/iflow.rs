use std::process::Command;
use tracing::{info, warn, instrument};

/// 检查 iFlow CLI 是否已安装
#[tauri::command]
#[instrument(skip())]
pub async fn check_iflow_installed() -> Result<bool, String> {
    info!("检查 iFlow CLI 安装状态");
    
    #[cfg(target_os = "windows")]
    let result = Command::new("iflow.cmd").arg("--version").output();
    
    #[cfg(not(target_os = "windows"))]
    let result = Command::new("iflow").arg("--version").output();
    
    match result {
        Ok(output) => {
            if output.status.success() {
                info!("iFlow CLI 已安装");
                Ok(true)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("iFlow CLI 命令执行失败：{}", stderr);
                Ok(false)
            }
        },
        Err(e) => {
            warn!("iFlow CLI 未安装或无法执行：{}", e);
            Ok(false)
        },
    }
}

/// 获取 iFlow CLI 使用指南
#[tauri::command]
#[instrument(skip())]
pub async fn get_iflow_guide() -> Result<String, String> {
    info!("获取 iFlow CLI 使用指南");
    
    let guide = r#"iFlow CLI 使用指南：

1. 安装 iFlow CLI
   npm install -g @iflow-ai/iflow-cli@latest

2. 验证安装
   iflow.cmd --version (Windows)
   iflow --version (macOS/Linux)

3. 启动 iFlow CLI
   iflow.cmd (Windows)
   iflow (macOS/Linux)

4. 登录
   - 选择 "Login with iFlow"（推荐）
   - 在浏览器中完成授权

5. 使用 iFlow
   - /init - 分析项目结构
   - /help - 查看帮助
   - @文件路径 - 引用文件
   - !命令 - 执行系统命令

6. 常用命令
   - /clear - 清空对话历史
   - /exit - 退出 CLI

详细文档：https://platform.iflow.cn/cli/quickstart"#;
    
    Ok(guide.to_string())
}

/// 启动 iFlow CLI
#[tauri::command]
#[instrument(skip())]
pub async fn start_iflow() -> Result<String, String> {
    info!("检查 iFlow CLI 是否可用");
    
    #[cfg(target_os = "windows")]
    let result = Command::new("iflow.cmd")
        .arg("--version")
        .output();
    
    #[cfg(not(target_os = "windows"))]
    let result = Command::new("iflow")
        .arg("--version")
        .output();
    
    match result {
        Ok(output) => {
            if output.status.success() {
                info!("iFlow CLI 已就绪");
                Ok("iFlow CLI 已就绪".to_string())
            } else {
                warn!("iFlow CLI 命令执行失败");
                Ok("iFlow CLI 未就绪".to_string())
            }
        },
        Err(e) => {
            warn!("iFlow CLI 不可用：{}", e);
            Ok("iFlow CLI 未安装".to_string())
        },
    }
}

/// 检查 iFlow CLI 是否在运行
#[tauri::command]
#[instrument(skip())]
pub async fn check_iflow_running() -> Result<bool, String> {
    info!("检查 iFlow CLI 运行状态");
    
    #[cfg(target_os = "windows")]
    let result = Command::new("wmic")
        .args(["process", "where", "name='node.exe' and commandline like '%iflow%' and not commandline like '%wmic%'", "get", "commandline"])
        .output();
    
    #[cfg(not(target_os = "windows"))]
    let result = Command::new("pgrep")
        .args(["-f", "iflow"])
        .output();
    
    match result {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let is_running = if cfg!(target_os = "windows") {
                output_str.contains("iflow") && !output_str.contains("wmic")
            } else {
                !output_str.trim().is_empty()
            };
            info!("iFlow CLI 运行状态：{}", is_running);
            Ok(is_running)
        },
        Err(e) => {
            warn!("检查 iFlow CLI 运行状态失败：{}", e);
            Ok(false)
        },
    }
}

/// 停止 iFlow CLI
#[tauri::command]
#[instrument(skip())]
pub async fn stop_iflow() -> Result<String, String> {
    info!("停止 iFlow CLI");
    
    #[cfg(target_os = "windows")]
    let result = Command::new("taskkill")
        .args(["/F", "/IM", "node.exe", "/FI", "WINDOWTITLE eq iflow*"])
        .output();
    
    #[cfg(not(target_os = "windows"))]
    let result = Command::new("pkill")
        .arg("-f")
        .arg("iflow")
        .output();
    
    match result {
        Ok(output) => {
            if output.status.success() {
                info!("iFlow CLI 已停止");
                Ok("iFlow CLI 已停止".to_string())
            } else {
                info!("iFlow CLI 未在运行");
                Ok("iFlow CLI 未在运行".to_string())
            }
        },
        Err(e) => {
            warn!("停止 iFlow CLI 失败：{}", e);
            Err(format!("停止失败：{}", e))
        },
    }
}
