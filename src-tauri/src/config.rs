use serde::{Deserialize, Serialize};
use tokio::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tracing::info;
use crate::zhipu_ai::ModelInfo;

/// 获取基础数据目录
/// 优先使用 IFLOW_CONFIG_DIR 环境变量，否则使用可执行文件所在目录
fn get_base_dir() -> Result<PathBuf, String> {
    // 优先检查自定义目录环境变量
    if let Ok(custom_dir) = std::env::var("IFLOW_CONFIG_DIR") {
        let dir = PathBuf::from(custom_dir);
        info!("使用自定义配置目录：{:?}", dir);
        return Ok(dir);
    }

    // 使用可执行文件所在目录
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("无法获取可执行文件路径：{}", e))?;

    exe_path.parent()
        .ok_or_else(|| "无法获取安装目录".to_string())
        .map(|p| p.to_path_buf())
}

/// 获取配置目录 (config/)
pub async fn get_config_dir() -> Result<PathBuf, String> {
    let dir = get_base_dir()?.join("config");
    if !dir.exists() {
        fs::create_dir_all(&dir).await
            .map_err(|e| format!("无法创建配置目录：{}", e))?;
    }
    Ok(dir)
}

/// 获取数据目录 (data/)
pub async fn get_data_dir() -> Result<PathBuf, String> {
    let dir = get_base_dir()?.join("data");
    if !dir.exists() {
        fs::create_dir_all(&dir).await
            .map_err(|e| format!("无法创建数据目录：{}", e))?;
    }
    Ok(dir)
}

/// 角色数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoleConfig {
    pub icon: String,
    pub label: String,
    pub value: String,
}

/// 应用配置结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub custom_roles: Vec<RoleConfig>,
    pub api_key: Option<String>,
    pub current_model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<i32>,
    #[serde(default)]
    pub cached_models: Vec<ModelInfo>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            custom_roles: Vec::new(),
            api_key: None,
            current_model: None,
            temperature: Some(0.7),
            max_tokens: Some(2048),
            cached_models: Vec::new(),
        }
    }
}

/// 加载配置
#[tauri::command]
pub async fn load_app_config(_app_handle: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_dir().await?.join("app_config.json");

    info!("加载配置文件：{:?}", config_path);

    if config_path.exists() {
        let content = fs::read_to_string(&config_path).await
            .map_err(|e| format!("读取配置文件失败：{}", e))?;

        let config: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("解析配置文件失败：{}", e))?;

        info!("配置加载成功，自定义角色数量：{}", config.custom_roles.len());
        Ok(config)
    } else {
        info!("配置文件不存在，使用默认配置");
        Ok(AppConfig::default())
    }
}

/// 保存配置
#[tauri::command]
pub async fn save_app_config(_app_handle: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_dir().await?.join("app_config.json");

    info!("保存配置文件：{:?}", config_path);

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败：{}", e))?;

    fs::write(&config_path, content).await
        .map_err(|e| format!("写入配置文件失败：{}", e))?;

    info!("配置保存成功");
    Ok(())
}

/// 添加自定义角色
#[tauri::command]
pub async fn add_custom_role(app_handle: AppHandle, role: RoleConfig) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone()).await?;
    config.custom_roles.push(role);
    save_app_config(app_handle, config).await
}

/// 删除自定义角色
#[tauri::command]
pub async fn delete_custom_role(app_handle: AppHandle, index: usize) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone()).await?;

    if index >= config.custom_roles.len() {
        return Err(format!("角色索引 {} 超出范围", index));
    }

    config.custom_roles.remove(index);
    save_app_config(app_handle, config).await
}

/// 获取 API Key
#[tauri::command]
pub async fn get_api_key(app_handle: AppHandle) -> Result<Option<String>, String> {
    let config = load_app_config(app_handle).await?;
    Ok(config.api_key)
}

/// 保存 API Key
#[tauri::command]
pub async fn save_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone()).await?;
    config.api_key = Some(api_key);
    save_app_config(app_handle, config).await
}
