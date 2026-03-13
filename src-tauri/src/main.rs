// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // 初始化日志系统
    tauri_app_lib::logging::init_logging();

    // 启动 Tauri 应用
    tauri_app_lib::run()
}
