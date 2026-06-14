use std::env;
use std::fs;
use std::path::Path;

fn main() {
    // 从 .env 文件读取版本号并设置到 tauri.conf.json
    let env_version = env::var("VITE_APP_VERSION").unwrap_or_else(|_| "1.8.1".to_string());

    let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    let tauri_conf_path = Path::new(&manifest_dir).join("tauri.conf.json");

    if tauri_conf_path.exists() {
        let content = fs::read_to_string(&tauri_conf_path).unwrap();
        let json: serde_json::Value = serde_json::from_str(&content).unwrap();

        // 只在版本号实际变化时才写入，避免触发无限重编译
        let current_version = json.get("version").and_then(|v| v.as_str()).unwrap_or("");
        if current_version != env_version {
            let mut json = json;
            if let Some(obj) = json.as_object_mut() {
                obj.insert("version".to_string(), serde_json::json!(env_version));
            }
            let new_content = serde_json::to_string_pretty(&json).unwrap();
            fs::write(&tauri_conf_path, new_content).unwrap();
        }
    }

    tauri_build::build()
}
