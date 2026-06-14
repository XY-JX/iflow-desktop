pub mod logging;
pub mod commands;
pub mod zhipu_ai;
pub mod config;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .manage(commands::zhipu::ZhipuState::new())
        .invoke_handler(tauri::generate_handler![
            // 智谱 AI 相关命令
            commands::zhipu::init_zhipu_client,
            commands::zhipu::send_message_to_zhipu_with_messages,
            commands::zhipu::send_message_to_zhipu_stream,
            commands::zhipu::send_message_to_zhipu_stream_with_context,
            commands::zhipu::check_zhipu_status,
            commands::zhipu::fetch_zhipu_models,
            // 对话管理相关命令
            commands::conversation::load_conversations,
            commands::conversation::save_conversations,
            // 配置相关命令
            config::load_app_config,
            config::save_app_config,
            config::add_custom_role,
            config::delete_custom_role,
            config::get_api_key,
            config::save_api_key,
            // 日志相关命令
            logging::get_log_file_path,
            logging::clean_old_logs,
            // TOTP 相关命令
            commands::totp::save_totp_secrets,
            commands::totp::load_totp_secrets,
            commands::totp::delete_totp_secrets,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
