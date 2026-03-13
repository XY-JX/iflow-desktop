use std::process::{Command, Stdio};
use std::io::{Write, BufRead, BufReader};
use tauri::Manager;

// 调用 iflow 命令行，通过 stdin 传递消息
#[tauri::command]
async fn call_iflow(message: String, model: Option<String>) -> Result<String, String> {
    // 创建 iflow 子进程
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

    // 获取 stdin 句柄
    let stdin = child.stdin.as_mut()
        .ok_or("无法获取 iflow 的 stdin")?;

    // 发送消息到 iflow（使用 echo 命令格式）
    if let Err(e) = writeln!(stdin, "{}", message) {
        return Err(format!("发送消息到 iflow 失败: {}", e));
    }

    // 关闭 stdin 以通知 iflow 输入结束
    drop(stdin);

    // 读取输出
    let stdout = child.stdout.as_mut()
        .ok_or("无法获取 iflow 的 stdout")?;

    let reader = BufReader::new(stdout);
    let mut output = String::new();

    // 逐行读取输出
    for line in reader.lines() {
        match line {
            Ok(l) => {
                // 跳过一些 iflow 的提示性输出
                if !l.starts_with(">") && !l.trim().is_empty() {
                    output.push_str(&l);
                    output.push('\n');
                }
            }
            Err(e) => return Err(format!("读取 iflow 输出失败: {}", e)),
        }
    }

    // 等待进程结束
    let status = match child.wait() {
        Ok(s) => s,
        Err(e) => return Err(format!("等待 iflow 进程结束失败: {}", e)),
    };

    if !status.success() {
        // 读取错误输出
        let stderr = child.stderr.as_mut()
            .ok_or("无法获取 iflow 的 stderr")?;

        let error_reader = BufReader::new(stderr);
        let mut error_output = String::new();
        for line in error_reader.lines().flatten() {
            error_output.push_str(&line);
            error_output.push('\n');
        }

        return Err(format!("iflow 执行失败\n错误输出:\n{}", error_output));
    }

    // 清理输出，去除多余的前缀和后缀
    let response = output.trim().to_string();

    Ok(response)
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
            load_conversations,
            save_conversations,
            check_iflow_installed
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}