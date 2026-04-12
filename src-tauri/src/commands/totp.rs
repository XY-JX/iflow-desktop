use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;

#[derive(Debug, Serialize, Deserialize)]
pub struct TotpSecret {
    pub id: String,
    pub name: String,
    pub secret: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
}

/// 获取TOTP数据文件路径
fn get_totp_file_path(_app: &AppHandle) -> PathBuf {
    // 使用安装目录下的 config 文件夹
    let exe_path = std::env::current_exe()
        .unwrap_or_else(|_| std::path::PathBuf::from("."));
    
    let install_dir = exe_path.parent()
        .unwrap_or_else(|| std::path::Path::new("."))
        .to_path_buf();
    
    let config_dir = install_dir.join("config");
    
    config_dir.join("totp_secrets.json")
}

/// 保存TOTP密钥
#[tauri::command]
pub fn save_totp_secrets(app: AppHandle, secrets: Vec<TotpSecret>) -> Result<(), String> {
    let file_path = get_totp_file_path(&app);
    
    // 确保目录存在
    if let Some(parent) = file_path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    
    // 序列化并写入文件
    let json = serde_json::to_string_pretty(&secrets)
        .map_err(|e| format!("序列化失败: {}", e))?;
    
    fs::write(&file_path, json).map_err(|e| format!("写入文件失败: {}", e))?;
    
    Ok(())
}

/// 加载TOTP密钥
#[tauri::command]
pub fn load_totp_secrets(app: AppHandle) -> Result<Vec<TotpSecret>, String> {
    let file_path = get_totp_file_path(&app);
    
    // 文件不存在时返回空列表
    if !file_path.exists() {
        return Ok(Vec::new());
    }
    
    // 读取并解析JSON
    let content = fs::read_to_string(&file_path)
        .map_err(|e| format!("读取文件失败: {}", e))?;
    
    let secrets: Vec<TotpSecret> = serde_json::from_str(&content)
        .map_err(|e| format!("解析JSON失败: {}", e))?;
    
    Ok(secrets)
}

/// 删除TOTP密钥文件
#[tauri::command]
pub fn delete_totp_secrets(app: AppHandle) -> Result<(), String> {
    let file_path = get_totp_file_path(&app);
    
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| format!("删除文件失败: {}", e))?;
    }
    
    Ok(())
}
