pub mod logging;

use std::process::Command;
use std::path::PathBuf;
use std::fs;
use tracing::{info, warn, error, debug, instrument};

/// 获取安装目录
fn get_install_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("无法获取可执行文件路径: {}", e))?;

    let install_dir = exe_path.parent()
        .ok_or_else(|| "无法获取安装目录".to_string())?
        .to_path_buf();

    Ok(install_dir)
}

/// 获取配置目录
fn get_config_dir() -> Result<PathBuf, String> {
    let install_dir = get_install_dir()?;
    let config_dir = install_dir.join("config");

    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("无法创建配置目录: {}", e))?;
    }

    Ok(config_dir)
}

// 检查 iflow 是否已安装
#[tauri::command]
#[instrument(skip())]
async fn check_iflow_installed() -> Result<bool, String> {
    info!("检查 iFlow CLI 安装状态");
    debug!("执行命令: iflow.cmd --version");

    match Command::new("iflow.cmd").arg("--version").output() {
        Ok(output) => {
            if output.status.success() {
                info!("iFlow CLI 已安装");
                Ok(true)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                warn!("iFlow CLI 命令执行失败: {}", stderr);
                Ok(false)
            }
        },
        Err(e) => {
            warn!("iFlow CLI 未安装或无法执行: {}", e);
            Ok(false)
        },
    }
}

// 获取 iflow CLI 的使用指南
#[tauri::command]
#[instrument(skip())]
async fn get_iflow_guide() -> Result<String, String> {
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

详细文档: https://platform.iflow.cn/cli/quickstart"#;

    debug!("使用指南已生成，长度: {} 字符", guide.len());
    Ok(guide.to_string())
}

// 读取对话历史（从本地存储）
#[tauri::command]
#[instrument(skip())]
async fn load_conversations() -> Result<Vec<serde_json::Value>, String> {
    info!("加载对话历史");

    let config_dir = get_config_dir()?;
    let conversations_file = config_dir.join("conversations.json");

    if !conversations_file.exists() {
        info!("对话历史文件不存在，返回空列表");
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&conversations_file)
        .map_err(|e| format!("读取对话历史失败: {}", e))?;

    let conversations: Vec<serde_json::Value> = serde_json::from_str(&content)
        .map_err(|e| format!("解析对话历史失败: {}", e))?;

    info!("成功加载 {} 个对话", conversations.len());
    Ok(conversations)
}

// 保存对话历史
#[tauri::command]
#[instrument(skip(_conversations))]
async fn save_conversations(_conversations: Vec<serde_json::Value>) -> Result<(), String> {
    info!("保存对话历史");
    debug!("对话数量: {}", _conversations.len());

    let config_dir = get_config_dir()?;
    let conversations_file = config_dir.join("conversations.json");

    let content = serde_json::to_string_pretty(&_conversations)
        .map_err(|e| format!("序列化对话历史失败: {}", e))?;

    fs::write(&conversations_file, content)
        .map_err(|e| format!("写入对话历史失败: {}", e))?;

    info!("对话历史保存成功");
    Ok(())
}

// 获取日志文件路径（用于用户查看）
#[tauri::command]
#[instrument(skip())]
async fn get_log_file_path() -> Result<Option<String>, String> {
    info!("获取日志文件路径");

    match crate::logging::get_log_file_path() {
        Some(path) => {
            let path_str = path.to_string_lossy().to_string();
            info!("日志文件路径: {}", path_str);
            Ok(Some(path_str))
        },
        None => {
            warn!("未找到日志文件");
            Ok(None)
        },
    }
}

// 清理旧日志文件
#[tauri::command]
#[instrument(skip())]
async fn clean_old_logs() -> Result<(), String> {
    info!("开始清理旧日志文件");

    match crate::logging::clean_old_logs() {
        Ok(()) => {
            info!("旧日志文件清理完成");
            Ok(())
        },
        Err(e) => {
            error!("清理旧日志文件失败: {}", e);
            Err(e)
        },
    }
}

// 启动 iFlow CLI
#[tauri::command]
#[instrument(skip())]
async fn start_iflow() -> Result<String, String> {
    info!("启动 iFlow CLI");

    #[cfg(target_os = "windows")]
    let result = Command::new("cmd")
        .args(["/c", "start", "cmd", "/k", "iflow.cmd"])
        .spawn();

    #[cfg(not(target_os = "windows"))]
    let result = Command::new("iflow")
        .spawn();

    match result {
        Ok(_) => {
            info!("iFlow CLI 启动成功");
            Ok("iFlow CLI 已启动".to_string())
        },
        Err(e) => {
            error!("启动 iFlow CLI 失败: {}", e);
            Err(format!("启动失败: {}", e))
        },
    }
}

// 检查 iFlow CLI 是否在运行
#[tauri::command]
#[instrument(skip())]
async fn check_iflow_running() -> Result<bool, String> {
    info!("检查 iFlow CLI 运行状态");

    #[cfg(target_os = "windows")]
    let result = Command::new("tasklist")
        .args(["/FI", "IMAGENAME eq node.exe", "/FO", "CSV"])
        .output();

    #[cfg(not(target_os = "windows"))]
    let result = Command::new("pgrep")
        .arg("-f")
        .arg("iflow")
        .output();

    match result {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let is_running = output_str.contains("node.exe") || output_str.contains("iflow");
            info!("iFlow CLI 运行状态: {}", is_running);
            Ok(is_running)
        },
        Err(e) => {
            warn!("检查 iFlow CLI 运行状态失败: {}", e);
            Ok(false)
        },
    }
}

// 停止 iFlow CLI
#[tauri::command]
#[instrument(skip())]
async fn stop_iflow() -> Result<String, String> {
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
                // Windows 上 taskkill 可能找不到进程，但这也是正常的
                info!("iFlow CLI 未在运行");
                Ok("iFlow CLI 未在运行".to_string())
            }
        },
        Err(e) => {
            warn!("停止 iFlow CLI 失败: {}", e);
            Err(format!("停止失败: {}", e))
        },
    }
}

// 向 iFlow CLI 发送消息（支持流式传输和思考模式）
#[tauri::command]
#[instrument(skip(message))]
async fn send_message_to_iflow(message: String) -> Result<serde_json::Value, String> {
    info!("向 iFlow CLI 发送消息: {}", message);

    #[cfg(target_os = "windows")]
    let iflow_cmd = "iflow.cmd";

    #[cfg(not(target_os = "windows"))]
    let iflow_cmd = "iflow";

    let cmd = Command::new(iflow_cmd)
        .arg("-p")
        .arg(&message)
        .arg("--stream")
        .arg("--thinking");

    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();

                info!("iFlow CLI 响应成功，输出长度: {}", stdout.len());

                // 解析执行信息
                let execution_info = parse_execution_info(&stderr);

                // 创建结构化响应
                let mut response = serde_json::json!({
                    "content": stdout,
                    "execution_info": execution_info
                });

                Ok(response)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                error!("iFlow CLI 命令执行失败: {}", stderr);
                
                let error_response = serde_json::json!({
                    "content": format!("错误: {}\n输出: {}", stderr, stdout),
                    "execution_info": null
                });
                
                Ok(error_response)
            }
        },
        Err(e) => {
            error!("发送消息到 iFlow CLI 失败: {}", e);
            Err(format!("执行失败: {}", e))
        },
    }
}

// 执行信息结构
#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct TokenUsage {
    input: u64,
    output: u64,
    total: u64,
}

#[derive(serde::Serialize, serde::Deserialize, Debug)]
struct ExecutionInfo {
    session_id: String,
    conversation_id: String,
    #[serde(rename = "assistantRounds")]
    assistant_rounds: u64,
    #[serde(rename = "executionTimeMs")]
    execution_time_ms: u64,
    #[serde(rename = "tokenUsage")]
    token_usage: TokenUsage,
}

// 解析执行信息
fn parse_execution_info(stderr: &str) -> Option<ExecutionInfo> {
    // 查找 <Execution Info> 标签内的 JSON
    let start_tag = "<Execution Info>";
    let end_tag = "</Execution Info>";

    if let Some(start) = stderr.find(start_tag) {
        if let Some(end) = stderr.find(end_tag) {
            let json_str = &stderr[start + start_tag.len()..end];
            match serde_json::from_str(json_str) {
                Ok(info) => Some(info),
                Err(e) => {
                    warn!("解析执行信息失败: {}", e);
                    None
                }
            }
        } else {
            None
        }
    } else {
        None
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    info!("启动 Tauri 应用");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            check_iflow_installed,
            get_iflow_guide,
            load_conversations,
            save_conversations,
            get_log_file_path,
            clean_old_logs,
            start_iflow,
            check_iflow_running,
            stop_iflow,
            send_message_to_iflow
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}