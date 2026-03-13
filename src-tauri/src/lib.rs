use std::process::Command;

// 检查 iflow 是否已安装
#[tauri::command]
async fn check_iflow_installed() -> Result<bool, String> {
    match Command::new("iflow").arg("--version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

// 获取 iflow CLI 的使用指南
#[tauri::command]
async fn get_iflow_guide() -> Result<String, String> {
    Ok(r#"iFlow CLI 使用指南：

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

详细文档: https://platform.iflow.cn/cli/quickstart"#.to_string())
}

// 读取对话历史（从本地存储）
#[tauri::command]
async fn load_conversations() -> Result<Vec<serde_json::Value>, String> {
    Ok(vec![])
}

// 保存对话历史
#[tauri::command]
async fn save_conversations(_conversations: Vec<serde_json::Value>) -> Result<(), String> {
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            check_iflow_installed,
            get_iflow_guide,
            load_conversations,
            save_conversations
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}