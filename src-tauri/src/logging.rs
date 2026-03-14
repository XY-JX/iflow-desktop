use std::path::PathBuf;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter, Layer};
use chrono::Local;

/// 初始化日志系统
///
/// 配置日志输出到控制台和文件
/// - 控制台：彩色输出，显示错误和警告级别
/// - 文件：详细日志，包含调试信息
pub fn init_logging() {
    // 获取应用数据目录
    let log_dir = get_log_directory();

    // 确保日志目录存在
    if let Err(e) = std::fs::create_dir_all(&log_dir) {
        eprintln!("无法创建日志目录: {:?}, 错误: {}", log_dir, e);
        return;
    }

    // 创建滚动文件日志（每天一个文件）
    let file_appender = RollingFileAppender::new(Rotation::DAILY, &log_dir, "iflow-desktop.log");

    // 配置日志级别过滤器
    // 从环境变量 RUST_LOG 读取，默认为 info
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info"));

    // 配置控制台输出（彩色，仅显示 info 及以上级别）
    let console_layer = fmt::layer()
        .with_target(true)
        .with_thread_ids(false)
        .with_file(true)
        .with_line_number(true)
        .with_level(true)
        .with_filter(EnvFilter::new("warn")); // 控制台只显示警告和错误

    // 配置文件输出（详细，包含调试信息）
    let file_layer = fmt::layer()
        .with_writer(file_appender)
        .with_target(true)
        .with_thread_ids(true)
        .with_file(true)
        .with_line_number(true)
        .with_level(true)
        .with_ansi(false) // 文件输出不使用 ANSI 颜色
        .with_filter(env_filter);

    // 初始化全局日志订阅器
    tracing_subscriber::registry()
        .with(console_layer)
        .with(file_layer)
        .init();

    tracing::info!("日志系统初始化成功");
    tracing::info!("日志目录: {:?}", log_dir);
}

/// 获取日志目录路径
///
/// 返回安装目录下的 logs 文件夹
fn get_log_directory() -> PathBuf {
    // 获取可执行文件路径
    let exe_path = std::env::current_exe()
        .unwrap_or_else(|_| PathBuf::from("."));

    // 获取安装目录（可执行文件的父目录）
    let install_dir = exe_path.parent()
        .unwrap_or(&PathBuf::from("."))
        .to_path_buf();

    // 在安装目录下创建 logs 文件夹
    let log_dir = install_dir.join("logs");

    // 确保日志目录存在
    if !log_dir.exists() {
        if let Err(e) = std::fs::create_dir_all(&log_dir) {
            eprintln!("无法创建日志目录: {:?}, 错误: {}", log_dir, e);
            // 如果创建失败，回退到当前目录
            return PathBuf::from("logs");
        }
    }

    log_dir
}

/// 获取当前日志文件路径（用于显示给用户）
pub fn get_log_file_path() -> Option<PathBuf> {
    let log_dir = get_log_directory();

    // 获取今天的日期字符串
    let today = chrono::Local::now().format("%Y-%m-%d").to_string();
    let log_file = log_dir.join(format!("iflow-desktop.log.{}", today));

    if log_file.exists() {
        Some(log_file)
    } else {
        // 如果今天的日志文件不存在，返回最新的日志文件
        if let Ok(mut entries) = std::fs::read_dir(&log_dir) {
            let mut latest_file: Option<PathBuf> = None;
            let mut latest_time: Option<std::time::SystemTime> = None;

            while let Some(Ok(entry)) = entries.next() {
                let path = entry.path();
                if path.extension().and_then(|s| s.to_str()) == Some("log") ||
                   path.extension().and_then(|s| s.to_str()) == Some("json") {
                    continue;
                }

                if let Ok(metadata) = std::fs::metadata(&path) {
                    if let Ok(modified) = metadata.modified() {
                        if latest_time.is_none() || modified > latest_time.unwrap() {
                            latest_time = Some(modified);
                            latest_file = Some(path);
                        }
                    }
                }
            }

            latest_file
        } else {
            None
        }
    }
}

/// 清理旧的日志文件（保留最近 7 天）
pub fn clean_old_logs() -> Result<(), String> {
    let log_dir = get_log_directory();

    if !log_dir.exists() {
        return Ok(());
    }

    let now = std::time::SystemTime::now();
    let duration_threshold = std::time::Duration::from_secs(7 * 24 * 60 * 60); // 7 天

    let entries = match std::fs::read_dir(&log_dir) {
        Ok(entries) => entries,
        Err(e) => return Err(format!("无法读取日志目录: {}", e)),
    };

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };

        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        // 检查文件修改时间
        let metadata = match std::fs::metadata(&path) {
            Ok(m) => m,
            Err(_) => continue,
        };

        let modified = match metadata.modified() {
            Ok(m) => m,
            Err(_) => continue,
        };

        let age = match now.duration_since(modified) {
            Ok(d) => d,
            Err(_) => continue, // 文件在未来时间，跳过
        };

        // 删除超过 7 天的日志文件
        if age > duration_threshold {
            if let Err(e) = std::fs::remove_file(&path) {
                tracing::warn!("无法删除旧日志文件 {:?}: {}", path, e);
            } else {
                tracing::info!("已删除旧日志文件: {:?}", path);
            }
        }
    }

    Ok(())
}