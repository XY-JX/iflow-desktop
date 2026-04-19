use serde::{Deserialize, Serialize};
use tokio::fs;
use tauri::AppHandle;
use crate::config::get_config_dir;

#[derive(Debug, Serialize, Deserialize)]
pub struct TotpSecret {
    pub id: String,
    pub name: String,
    pub secret: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
}

/// 获取TOTP数据文件路径
async fn get_totp_file_path(_app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let config_dir = get_config_dir().await?;
    Ok(config_dir.join("totp_secrets.json"))
}

/// 保存TOTP密钥
#[tauri::command]
pub async fn save_totp_secrets(app: AppHandle, secrets: Vec<TotpSecret>) -> Result<(), String> {
    let file_path = get_totp_file_path(&app).await?;
    
    // 确保目录存在
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("创建目录失败: {}", e))?;
    }
    
    // 序列化并写入文件
    let json = serde_json::to_string_pretty(&secrets)
        .map_err(|e| format!("序列化失败: {}", e))?;
    
    fs::write(&file_path, json)
        .await
        .map_err(|e| format!("写入文件失败: {}", e))?;
    
    Ok(())
}

/// 加载TOTP密钥
#[tauri::command]
pub async fn load_totp_secrets(app: AppHandle) -> Result<Vec<TotpSecret>, String> {
    let file_path = get_totp_file_path(&app).await?;
    
    // 文件不存在时返回空列表
    if !file_path.exists() {
        return Ok(Vec::new());
    }
    
    // 读取并解析JSON
    let content = fs::read_to_string(&file_path)
        .await
        .map_err(|e| format!("读取文件失败: {}", e))?;
    
    let secrets: Vec<TotpSecret> = serde_json::from_str(&content)
        .map_err(|e| format!("解析JSON失败: {}", e))?;
    
    Ok(secrets)
}

/// 删除TOTP密钥文件
#[tauri::command]
pub async fn delete_totp_secrets(app: AppHandle) -> Result<(), String> {
    let file_path = get_totp_file_path(&app).await?;
    
    if file_path.exists() {
        fs::remove_file(&file_path)
            .await
            .map_err(|e| format!("删除文件失败: {}", e))?;
    }
    
    Ok(())
}
