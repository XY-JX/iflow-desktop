use std::process::{Command, Stdio, Child};
use std::io::{Write, BufRead, BufReader};
use std::sync::Mutex;

// 全局 iflow 进程管理器
struct IFlowProcessManager {
    process: Mutex<Option<Child>>,
}

// 全局进程管理器实例
static IFLOW_MANAGER: Mutex<IFlowProcessManager> = Mutex::new(IFlowProcessManager {
    process: Mutex::new(None),
});

// 调用 iflow 命令行，通过 stdin 传递消息
#[tauri::command]
async fn call_iflow(message: String, model: Option<String>) -> Result<String, String> {
    let mut child = match Command::new("iflow")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    {
        Ok(child) => child,
        Err(e) => {
            return Err(format!("无法启动 iflow: {}\n请确保:\n1. 已安装 iflow: npm i -g @iflow-ai/iflow-cli\n2. iflow 已在系统 PATH 中\n3. 已完成认证登录", e));
        }
    };

    let mut stdin = child.stdin.take().ok_or("无法获取 iflow 的 stdin")?;
    let mut stdout = child.stdout.take().ok_or("无法获取 iflow 的 stdout")?;

    // 发送消息到 iflow
    if let Err(e) = writeln!(stdin, "{}", message) {
        return Err(format!("发送消息到 iflow 失败: {}", e));
    }
    stdin.flush().map_err(|e| format!("刷新 stdin 失败: {}", e))?;
    drop(stdin);

    // 读取输出
    let reader = BufReader::new(&mut stdout);
    let mut output = String::new();
    let mut found_response = false;
    let mut line_count = 0;

    for line in reader.lines() {
        match line {
            Ok(l) => {
                line_count += 1;

                // 跳过提示符行
                if l.starts_with('>') {
                    continue;
                }

                // 如果是空行且已经找到了响应内容，可能表示结束
                if l.trim().is_empty() && found_response {
                    break;
                }

                // 忽略一些常见的提示信息
                if l.contains("Type /help") || l.contains("Type /exit") || l.contains("context left:") {
                    continue;
                }

                // 记录有内容的行
                if !l.trim().is_empty() {
                    output.push_str(&l);
                    output.push('\n');
                    found_response = true;
                }

                // 如果读取了太多行还没有找到响应，可能有问题
                if line_count > 50 && !found_response {
                    break;
                }

                // 如果已经找到了响应，并且读取了足够的行，停止读取
                if found_response && line_count > 10 {
                    std::thread::sleep(std::time::Duration::from_millis(100));
                }
            }
            Err(e) => return Err(format!("读取 iflow 输出失败: {}", e)),
        }
    }

    // 等待进程结束
    let _ = child.wait();

    // 清理输出
    let response = output.trim().to_string();

    if response.is_empty() {
        return Err("iflow 没有返回任何响应".to_string());
    }

    Ok(response)
}

// 重启 iflow 进程（用于清除对话历史）
#[tauri::command]
async fn restart_iflow() -> Result<(), String> {
    let manager = IFLOW_MANAGER.lock().unwrap();
    
    // 关闭现有进程
    if let Some(mut child) = manager.process.lock().unwrap().take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    
    Ok(())
}

// 读取对话历史（从本地存储）
#[tauri::command]
async fn load_conversations() -> Result<Vec<serde_json::Value>, String> {
    // 这里可以从文件系统加载对话历史
    // 暂时返回空数组
    Ok(vec![])
}

// 保存对话历史
#[tauri::command]
async fn save_conversations(_conversations: Vec<serde_json::Value>) -> Result<(), String> {
    // 这里可以将对话历史保存到文件系统
    // 暂时不做任何操作
    Ok(())
}

// 检查 iflow 是否已安装
#[tauri::command]
async fn check_iflow_installed() -> Result<bool, String> {
    match Command::new("iflow").arg("--version").output() {
        Ok(output) => Ok(output.status.success()),
        Err(_) => Ok(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            call_iflow,
            restart_iflow,
            load_conversations,
            save_conversations,
            check_iflow_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}