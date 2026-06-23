use tokio::fs;
use tracing::{info, instrument};
use serde::{Deserialize, Serialize};
use crate::config::get_data_dir;

/// 消息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConversationMessage {
    pub id: String,
    pub role: String,
    pub content: String,
    pub timestamp: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thinking: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub execution_info: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reply_to: Option<String>,
}

/// 对话结构
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<ConversationMessage>,
    pub model: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    pub created_at: i64,
    pub updated_at: i64,
}

/// 加载对话历史
#[tauri::command]
#[instrument(skip())]
pub async fn load_conversations() -> Result<Vec<Conversation>, String> {
    info!("加载对话历史");

    let data_dir = get_data_dir().await?;
    let conversations_file = data_dir.join("conversations.json");

    if !conversations_file.exists() {
        info!("对话历史文件不存在，返回空列表");
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&conversations_file).await
        .map_err(|e| format!("读取对话历史失败：{}", e))?;

    let conversations: Vec<Conversation> = serde_json::from_str(&content)
        .map_err(|e| format!("解析对话历史失败：{}", e))?;

    info!("成功加载 {} 个对话", conversations.len());
    Ok(conversations)
}

/// 保存对话历史
#[tauri::command]
#[instrument(skip(conversations))]
pub async fn save_conversations(conversations: Vec<Conversation>) -> Result<(), String> {
    info!("保存对话历史，数量：{}", conversations.len());

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
