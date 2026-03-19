use std::process::Command;
use serde::{Serialize, Deserialize};
use tracing::{info, warn, error, instrument};

/// 执行信息结构
#[derive(Serialize, Deserialize, Debug)]
struct TokenUsage {
    input: u64,
    output: u64,
    total: u64,
}

#[derive(Serialize, Deserialize, Debug)]
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

/// 向 iFlow CLI 发送消息
#[tauri::command]
#[instrument(skip(message))]
pub async fn send_message_to_iflow(message: String) -> Result<serde_json::Value, String> {
    info!("向 iFlow CLI 发送消息：{}", message);
    
    #[cfg(target_os = "windows")]
    let iflow_cmd = "iflow.cmd";
    
    #[cfg(not(target_os = "windows"))]
    let iflow_cmd = "iflow";
    
    let mut cmd = Command::new(iflow_cmd);
    cmd.arg("-p")
        .arg(&message)
        .arg("--stream")
        .arg("--thinking");  // 使用 thinking 模式显示思考过程
    
    // Windows 上隐藏命令行窗口
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    
    match cmd.output() {
        Ok(output) => {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                
                info!("iFlow CLI 响应成功，输出长度：{}", stdout.len());
                
                // 解析执行信息
                let execution_info = parse_execution_info(&stderr);
                
                // 创建结构化响应
                let response = serde_json::json!({
                    "content": stdout,
                    "execution_info": execution_info
                });
                
                Ok(response)
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                let stdout = String::from_utf8_lossy(&output.stdout);
                error!("iFlow CLI 命令执行失败：{}", stderr);
                
                let error_response = serde_json::json!({
                    "content": format!("错误：{}\n输出：{}", stderr, stdout),
                    "execution_info": null
                });
                
                Ok(error_response)
            }
        },
        Err(e) => {
            error!("发送消息到 iFlow CLI 失败：{}", e);
            Err(format!("执行失败：{}", e))
        },
    }
}

/// 解析执行信息
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
                    warn!("解析执行信息失败：{}", e);
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
