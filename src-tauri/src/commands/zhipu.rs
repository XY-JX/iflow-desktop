use crate::zhipu_ai::{ZhipuAiClient, ChatMessage, ChatCompletionRequest, models};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error, instrument};
use tokio_stream::StreamExt;
use tauri::Emitter;

/// 消息请求结构
#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub message: String,
    pub model: Option<String>,
}

/// 流式消息请求结构 (支持上下文)
#[derive(Debug, Deserialize)]
pub struct SendMessageStreamRequest {
    pub messages: Vec<ChatMessageData>,
    pub model: Option<String>,
    pub temperature: Option<f32>,
    pub max_tokens: Option<i32>,
    pub system_prompt: Option<String>,
}

/// 简化版 ChatMessage 用于前端传递
#[derive(Debug, Deserialize, Clone)]
pub struct ChatMessageData {
    pub role: String,
    pub content: String,
}

/// 消息响应结构
#[derive(Debug, Serialize)]
pub struct SendMessageResponse {
    pub content: String,
    pub model: String,
    pub usage: Option<TokenUsage>,
}

#[derive(Debug, Serialize)]
pub struct TokenUsage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

/// 全局客户端 (懒加载)
static ZHIPU_CLIENT: once_cell::sync::Lazy<Arc<Mutex<Option<ZhipuAiClient>>>> = 
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(None)));

/// 初始化智谱 AI 客户端
#[tauri::command]
#[instrument(skip())]
pub async fn init_zhipu_client(api_key: String) -> Result<String, String> {
    info!("初始化智谱 AI 客户端");
    
    let client = ZhipuAiClient::new(api_key);
    let mut client_opt = ZHIPU_CLIENT.lock().await;
    *client_opt = Some(client);
    
    info!("智谱 AI 客户端初始化成功");
    Ok("智谱 AI 已就绪".to_string())
}

/// 发送消息到智谱 AI (非流式)
#[tauri::command]
#[instrument(skip())]
pub async fn send_message_to_zhipu(
    message: String,
    model: Option<String>,
) -> Result<SendMessageResponse, String> {
    info!("发送消息到智谱 AI，模型：{:?}", model);
    
    let client_guard = ZHIPU_CLIENT.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;
    
    // 构建消息历史 (简单实现，只包含当前消息)
    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: "你是一个有用的 AI 编程助手。".to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: message.clone(),
        },
    ];
    
    // 选择模型
    let selected_model = model.unwrap_or_else(|| models::GLM_4.to_string());
    
    let request = ChatCompletionRequest {
        model: selected_model.clone(),
        messages,
        temperature: Some(0.7),
        max_tokens: Some(2048),
        stream: Some(false),
        top_p: Some(0.7),
    };
    
    // 发送请求
    match client.chat(&request).await {
        Ok(response) => {
            if let Some(choice) = response.choices.first() {
                info!("收到响应 - tokens: 输入={}/输出={}, 总计={}", 
                    response.usage.prompt_tokens, 
                    response.usage.completion_tokens,
                    response.usage.total_tokens);
                
                Ok(SendMessageResponse {
                    content: choice.message.content.clone(),
                    model: selected_model,
                    usage: Some(TokenUsage {
                        prompt_tokens: response.usage.prompt_tokens,
                        completion_tokens: response.usage.completion_tokens,
                        total_tokens: response.usage.total_tokens,
                    }),
                })
            } else {
                Err("API 返回空响应".to_string())
            }
        }
        Err(e) => {
            error!("智谱 AI 调用失败：{}", e);
            Err(format!("AI 调用失败：{}", e))
        }
    }
}

/// 检查智谱 AI 服务状态
#[tauri::command]
#[instrument(skip())]
pub async fn check_zhipu_status() -> Result<bool, String> {
    let client_guard = ZHIPU_CLIENT.lock().await;
    Ok(client_guard.is_some())
}

/// 发送流式消息到智谱 AI (带上下文)
#[tauri::command]
pub async fn send_message_to_zhipu_stream_with_context(
    messages: Vec<ChatMessageData>,
    model: Option<String>,
    temperature: Option<f32>,
    max_tokens: Option<i32>,
    system_prompt: Option<String>,
    window: tauri::Window,
) -> Result<(), String> {
    info!("发送流式消息到智谱 AI，模型：{:?}", model);
    
    let start_time = std::time::Instant::now();
    
    let client_guard = ZHIPU_CLIENT.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;
    
    // 构建消息历史
    let mut messages_vec = Vec::new();
    
    // 添加系统提示词
    let system_content = system_prompt
        .unwrap_or_else(|| "你是一个有用的 AI 编程助手。".to_string());
    messages_vec.push(ChatMessage {
        role: "system".to_string(),
        content: system_content,
    });
    
    // 添加对话历史
    for msg in messages {
        messages_vec.push(ChatMessage {
            role: msg.role,
            content: msg.content,
        });
    }
    
    // 选择模型
    let selected_model = model.unwrap_or_else(|| models::GLM_4.to_string());
    
    let request = ChatCompletionRequest {
        model: selected_model.clone(),
        messages: messages_vec,
        temperature: temperature.or(Some(0.7)),
        max_tokens: max_tokens.or(Some(2048)),
        stream: Some(true),
        top_p: Some(0.7),
    };
    
    // 发送流式请求
    match client.chat_stream(&request).await {
        Ok(stream) => {
            let mut stream = Box::pin(stream);
            let mut full_content = String::new();
            
            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(content) => {
                        if !content.is_empty() {
                            full_content.push_str(&content);
                            
                            // 实时发送到前端
                            let _ = window.emit("ai-chunk", serde_json::json!({
                                "content": content,
                                "full_content": full_content
                            }));
                        }
                    }
                    Err(e) => {
                        error!("流式接收失败：{}", e);
                        let _ = window.emit("ai-error", serde_json::json!({
                            "error": format!("流式接收失败：{}", e)
                        }));
                        return Err(e);
                    }
                }
            }
            
            let elapsed = start_time.elapsed().as_millis();
            info!("流式完成 - 总内容长度：{}, 耗时：{}ms", full_content.len(), elapsed);
            
            // 发送完成事件
            let _ = window.emit("ai-complete", serde_json::json!({
                "content": full_content,
                "model": selected_model,
                "execution_time_ms": elapsed as i32
            }));
            
            Ok(())
        }
        Err(e) => {
            error!("智谱 AI 流式调用失败：{}", e);
            let _ = window.emit("ai-error", serde_json::json!({
                "error": format!("AI 调用失败：{}", e)
            }));
            Err(format!("AI 调用失败：{}", e))
        }
    }
}

/// 发送流式消息到智谱 AI
#[tauri::command]
pub async fn send_message_to_zhipu_stream(
    message: String,
    model: Option<String>,
    window: tauri::Window,
) -> Result<(), String> {
    info!("发送流式消息到智谱 AI，模型：{:?}", model);
    
    let start_time = std::time::Instant::now();
    
    let client_guard = ZHIPU_CLIENT.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;
    
    // 构建消息历史
    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: "你是一个有用的 AI 编程助手。".to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: message.clone(),
        },
    ];
    
    // 选择模型
    let selected_model = model.unwrap_or_else(|| models::GLM_4.to_string());
    
    let request = ChatCompletionRequest {
        model: selected_model.clone(),
        messages,
        temperature: Some(0.7),
        max_tokens: Some(2048),
        stream: Some(true),
        top_p: Some(0.7),
    };
    
    // 发送流式请求
    match client.chat_stream(&request).await {
        Ok(stream) => {
            let mut stream = Box::pin(stream);
            let mut full_content = String::new();
            
            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(content) => {
                        if !content.is_empty() {
                            full_content.push_str(&content);
                            
                            // 实时发送到前端
                            let _ = window.emit("ai-chunk", serde_json::json!({
                                "content": content,
                                "full_content": full_content
                            }));
                        }
                    }
                    Err(e) => {
                        error!("流式接收失败：{}", e);
                        let _ = window.emit("ai-error", serde_json::json!({
                            "error": format!("流式接收失败：{}", e)
                        }));
                        return Err(e);
                    }
                }
            }
            
            let elapsed = start_time.elapsed().as_millis();
            info!("流式完成 - 总内容长度：{}, 耗时：{}ms", full_content.len(), elapsed);
            
            // 发送完成事件
            let _ = window.emit("ai-complete", serde_json::json!({
                "content": full_content,
                "model": selected_model,
                "execution_time_ms": elapsed as i32
            }));
            
            Ok(())
        }
        Err(e) => {
            error!("智谱 AI 流式调用失败：{}", e);
            let _ = window.emit("ai-error", serde_json::json!({
                "error": format!("AI 调用失败：{}", e)
            }));
            Err(format!("AI 调用失败：{}", e))
        }
    }
}
