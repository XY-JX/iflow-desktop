pub mod logging;
pub mod commands;

use tracing::info;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    info!("启动 Tauri 应用");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // iFlow 相关命令
            commands::iflow::check_iflow_installed,
            commands::iflow::get_iflow_guide,
            commands::iflow::start_iflow,
            commands::iflow::check_iflow_running,
            commands::iflow::stop_iflow,
            // 消息相关命令
            commands::message::send_message_to_iflow,
            // 对话管理相关命令
            commands::conversation::load_conversations,
            commands::conversation::save_conversations,
            // 日志相关命令
            logging::get_log_file_path,
            logging::clean_old_logs,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
