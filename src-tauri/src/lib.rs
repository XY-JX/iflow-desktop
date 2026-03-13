mod logging;

use std::process::Command;
use tracing::{info, warn, error, debug, instrument};

// 检查 iflow 是否已安装
#[tauri::command]
#[instrument(skip())]
async fn check_iflow_installed() -> Result<bool, String> {
    info!("检查 iFlow CLI 安装状态");
    debug!("执行命令: iflow --version");

    match Command::new("iflow").arg("--version").output() {
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
   iflow --version

3. 启动 iFlow CLI
   iflow

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
    debug!("当前返回空对话列表");
    Ok(vec![])
}

// 保存对话历史
#[tauri::command]
#[instrument(skip(_conversations))]
async fn save_conversations(_conversations: Vec<serde_json::Value>) -> Result<(), String> {
    info!("保存对话历史");
    debug!("对话数量: {}", _conversations.len());
    // TODO: 实现实际的保存逻辑
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
            clean_old_logs
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}