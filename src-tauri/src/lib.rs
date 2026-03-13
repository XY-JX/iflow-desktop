use std::process::{Command, Stdio, Child, ChildStdin, ChildStdout};
use std::io::{Write, BufRead, BufReader};
use std::sync::Mutex;
use tauri::Manager;
use std::collections::HashMap;

// 全局 iflow 进程管理器
struct IFlowProcessManager {
    process: Mutex<Option<Child>>,
    stdin: Mutex<Option<ChildStdin>>,
    stdout: Mutex<Option<ChildStdout>>,
}

// 全局进程管理器实例
static IFLOW_MANAGER: Mutex<IFlowProcessManager> = Mutex::new(IFlowProcessManager {
    process: Mutex::new(None),
    stdin: Mutex::new(None),
    stdout: Mutex::new(None),
});

// 启动或获取 iflow 进程
fn get_or_start_iflow_process() -> Result<(&'static Mutex<Option<ChildStdin>>, &'static Mutex<Option<ChildStdout>>), String> {
    let mut manager = IFLOW_MANAGER.lock().unwrap();
    
    // 检查进程是否已存在
    if manager.process.lock().unwrap().is_some() {
        return Ok((&manager.stdin, &manager.stdout));
    }
    
    // 启动新的 iflow 进程
    let mut child = Command::new("iflow")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("无法启动 iflow: {}\n请确保:\n1. 已安装 iflow: npm i -g @iflow-ai/iflow-cli\n2. iflow 已在系统 PATH 中\n3. 已完成认证登录", e))?;
    
    let stdin = child.stdin.take().ok_or("无法获取 iflow 的 stdin")?;
    let stdout = child.stdout.take().ok_or("无法获取 iflow 的 stdout")?;
    
    // 保存进程和管道
    *manager.process.lock().unwrap() = Some(child);
    *manager.stdin.lock().unwrap() = Some(stdin);
    *manager.stdout.lock().unwrap() = Some(stdout);
    
    Ok((&manager.stdin, &manager.stdout))
}

// 调用 iflow 命令行，通过 stdin 传递消息
#[tauri::command]
async fn call_iflow(message: String, model: Option<String>) -> Result<String, String> {
    // 获取或启动 iflow 进程
    let (stdin_mutex, stdout_mutex) = get_or_start_iflow_process()?;
    
    // 发送消息到 iflow
    {
        let stdin = stdin_mutex.lock().unwrap();
        let stdin_ref = stdin.as_ref().ok_or("无法获取 iflow 的 stdin")?;
        
        if let Err(e) = writeln!(stdin_ref, "{}", message) {
            return Err(format!("发送消息到 iflow 失败: {}", e));
        }
        // 不要关闭 stdin，保持进程运行以维持对话上下文
        stdin_ref.flush().map_err(|e| format!("刷新 stdin 失败: {}", e))?;
    }
    
    // 读取输出
    {
        let stdout = stdout_mutex.lock().unwrap();
        let stdout_ref = stdout.as_ref().ok_or("无法获取 iflow 的 stdout")?;
        
        let reader = BufReader::new(stdout_ref);
        let mut output = String::new();
        let mut found_response = false;
        let mut line_count = 0;
        
        // 读取输出，直到遇到提示符或读取到响应
        for line in reader.lines() {
            match line {
                Ok(l) => {
                    line_count += 1;
                    
                    // 跳过提示符行
                    if l.starts_with(">") {
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
                        // 等待一下，看看是否还有更多输出
                        std::thread::sleep(std::time::Duration::from_millis(100));
                    }
                }
                Err(e) => return Err(format!("读取 iflow 输出失败: {}", e)),
            }
        }
        
        // 清理输出
        let response = output.trim().to_string();
        
        if response.is_empty() {
            return Err("iflow 没有返回任何响应".to_string());
        }
        
        Ok(response)
    }
}

// 重启 iflow 进程（用于清除对话历史）
#[tauri::command]
async fn restart_iflow() -> Result<(), String> {
    let mut manager = IFLOW_MANAGER.lock().unwrap();
    
    // 关闭现有进程
    if let Some(mut child) = manager.process.lock().unwrap().take() {
        let _ = child.kill();
        let _ = child.wait();
    }
    
    // 清空管道
    *manager.stdin.lock().unwrap() = None;
    *manager.stdout.lock().unwrap() = None;
    
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
async fn save_conversations(conversations: Vec<serde_json::Value>) -> Result<(), String> {
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