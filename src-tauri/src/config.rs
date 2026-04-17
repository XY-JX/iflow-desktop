use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::AppHandle;
use tracing::info;
use crate::zhipu_ai::ModelInfo;

/// 获取安装目录
pub fn get_install_dir() -> Result<PathBuf, String> {
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("无法获取可执行文件路径：{}", e))?;
    
    exe_path.parent()
        .ok_or_else(|| "无法获取安装目录".to_string())
        .map(|p| p.to_path_buf())
}

/// 获取配置目录 (config/)
pub fn get_config_dir() -> Result<PathBuf, String> {
    let install_dir = get_install_dir()?;
    let config_dir = install_dir.join("config");
    
    if !config_dir.exists() {
        fs::create_dir_all(&config_dir)
            .map_err(|e| format!("无法创建配置目录：{}", e))?;
    }
    
    Ok(config_dir)
}

/// 获取数据目录 (data/)
pub fn get_data_dir() -> Result<PathBuf, String> {
    let install_dir = get_install_dir()?;
    let data_dir = install_dir.join("data");
    
    if !data_dir.exists() {
        fs::create_dir_all(&data_dir)
            .map_err(|e| format!("无法创建数据目录：{}", e))?;
    }
    
    Ok(data_dir)
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
    pub cached_models: Vec<ModelInfo>, // 缓存的模型列表
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

/// 获取配置文件路径 (使用应用安装目录或自定义路径)
fn get_config_path(_app_handle: &AppHandle) -> Result<PathBuf, String> {
    // 优先检查是否设置了自定义配置目录环境变量
    if let Ok(custom_dir) = std::env::var("IFLOW_CONFIG_DIR") {
        let config_dir = PathBuf::from(custom_dir);
        
        // 确保配置目录存在
        if let Err(e) = fs::create_dir_all(&config_dir) {
            return Err(format!("创建配置目录失败：{}", e));
        }
        
        info!("使用自定义配置目录：{:?}", config_dir);
        return Ok(config_dir.join("app_config.json"));
    }
    
    // 获取应用可执行文件所在目录
    let app_exe = std::env::current_exe()
        .map_err(|e| format!("获取应用路径失败：{}", e))?;
    
    let app_dir = app_exe.parent()
        .ok_or("无法确定应用目录")?;
    
    // 在安装目录下创建 config 文件夹
    let config_dir = PathBuf::from(app_dir).join("config");
    
    // 确保配置目录存在
    if let Err(e) = fs::create_dir_all(&config_dir) {
        return Err(format!("创建配置目录失败：{}", e));
    }
    
    info!("配置目录：{:?}", config_dir);
    Ok(config_dir.join("app_config.json"))
}

/// 加载配置
#[tauri::command]
pub fn load_app_config(app_handle: AppHandle) -> Result<AppConfig, String> {
    let config_path = get_config_path(&app_handle)?;
    
    info!("加载配置文件：{:?}", config_path);
    
    if config_path.exists() {
        let content = fs::read_to_string(&config_path)
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
pub fn save_app_config(app_handle: AppHandle, config: AppConfig) -> Result<(), String> {
    let config_path = get_config_path(&app_handle)?;
    
    info!("保存配置文件：{:?}", config_path);
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败：{}", e))?;
    
    fs::write(&config_path, content)
        .map_err(|e| format!("写入配置文件失败：{}", e))?;
    
    info!("配置保存成功");
    Ok(())
}

/// 添加自定义角色
#[tauri::command]
pub fn add_custom_role(app_handle: AppHandle, role: RoleConfig) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone())?;
    config.custom_roles.push(role);
    save_app_config(app_handle, config)?;
    Ok(())
}

/// 删除自定义角色
#[tauri::command]
pub fn delete_custom_role(app_handle: AppHandle, index: usize) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone())?;
    
    if index >= config.custom_roles.len() {
        return Err(format!("角色索引 {} 超出范围", index));
    }
    
    config.custom_roles.remove(index);
    save_app_config(app_handle, config)?;
    Ok(())
}

/// 获取 API Key
#[tauri::command]
pub fn get_api_key(app_handle: AppHandle) -> Result<Option<String>, String> {
    let config = load_app_config(app_handle.clone())?;
    Ok(config.api_key)
}

/// 保存 API Key
#[tauri::command]
pub fn save_api_key(app_handle: AppHandle, api_key: String) -> Result<(), String> {
    let mut config = load_app_config(app_handle.clone())?;
    config.api_key = Some(api_key);
    save_app_config(app_handle, config)?;
    Ok(())
}

