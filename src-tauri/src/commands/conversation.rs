use std::path::PathBuf;
use std::fs;
use tracing::{info, debug};

/// 获取配置目录
pub fn get_config_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("无法获取可执行文件路径：{}", e))?;
    
    let install_dir = exe_path.parent()
        .ok_or_else(|| "无法获取安装目录".to_string())?
        .to_path_buf();
    
    let config_dir = install_dir.join("config");
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("无法创建配置目录：{}", e))?;
    }
    
    Ok(config_dir)
}

/// 加载对话历史
#[tauri::command]
#[instrument(skip())]
pub async fn load_conversations() -> Result<Vec<serde_json::Value>, String> {
    info!("加载对话历史");
    
    let config_dir = get_config_dir()?;
    let conversations_file = config_dir.join("conversations.json");
    
    if !conversations_file.exists() {
        info!("对话历史文件不存在，返回空列表");
        return Ok(vec![]);
    }
    
    let content = fs::read_to_string(&conversations_file)
        .map_err(|e| format!("读取对话历史失败：{}", e))?;
    
    let conversations: Vec<serde_json::Value> = serde_json::from_str(&content)
        .map_err(|e| format!("解析对话历史失败：{}", e))?;
    
    info!("成功加载 {} 个对话", conversations.len());
    Ok(conversations)
}

/// 保存对话历史
#[tauri::command]
#[instrument(skip(_conversations))]
pub async fn save_conversations(_conversations: Vec<serde_json::Value>) -> Result<(), String> {
    info!("保存对话历史");
    debug!("对话数量：{}", _conversations.len());
    
    let config_dir = get_config_dir()?;
    let conversations_file = config_dir.join("conversations.json");
    
    let content = serde_json::to_string_pretty(&_conversations)
        .map_err(|e| format!("序列化对话历史失败：{}", e))?;
    
    fs::write(&conversations_file, content)
        .map_err(|e| format!("写入对话历史失败：{}", e))?;
    
    info!("对话历史保存成功");
    Ok(())
}
