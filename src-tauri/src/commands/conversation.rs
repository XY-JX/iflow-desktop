use tokio::fs;
use tracing::{info, instrument};
use crate::config::get_data_dir;

/// 加载对话历史
/// 使用 serde_json::Value 保持与前端数据格式的完全兼容
#[tauri::command]
#[instrument(skip())]
pub async fn load_conversations() -> Result<Vec<serde_json::Value>, String> {
    info!("加载对话历史");

    let data_dir = get_data_dir().await?;
    let conversations_file = data_dir.join("conversations.json");

    if !conversations_file.exists() {
        info!("对话历史文件不存在，返回空列表");
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&conversations_file).await
        .map_err(|e| format!("读取对话历史失败：{}", e))?;

    let conversations: Vec<serde_json::Value> = serde_json::from_str(&content)
        .map_err(|e| format!("解析对话历史失败：{}", e))?;

    info!("成功加载 {} 个对话", conversations.len());
    Ok(conversations)
}

/// 保存对话历史
#[tauri::command]
#[instrument(skip(conversations))]
pub async fn save_conversations(conversations: Vec<serde_json::Value>) -> Result<(), String> {
    info!("=== Rust: 保存对话历史 ===");
    info!("对话数量：{}", conversations.len());
    // 打印每个对话的ID
    for (i, conv) in conversations.iter().enumerate() {
        if let Some(id) = conv.get("id").and_then(|v| v.as_str()) {
            info!("对话 {}: id={}", i, id);
        }
    }

    let data_dir = get_data_dir().await?;

    fs::create_dir_all(&data_dir).await
        .map_err(|e| format!("创建数据目录失败：{}", e))?;

    let conversations_file = data_dir.join("conversations.json");

    let content = serde_json::to_string_pretty(&conversations)
        .map_err(|e| format!("序列化对话历史失败：{}", e))?;

    fs::write(&conversations_file, content).await
        .map_err(|e| format!("写入对话历史失败：{}", e))?;

    info!("对话历史保存成功");
    Ok(())
}
