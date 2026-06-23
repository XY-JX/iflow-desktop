use crate::zhipu_ai::{ZhipuAiClient, ChatMessage, ChatCompletionRequest, models, ModelInfo};
use serde::Deserialize;
use tokio::sync::Mutex;
use tracing::{info, warn, error, instrument};
use tokio_stream::StreamExt;
use tauri::Emitter;
use futures_core::Stream;
use std::pin;

/// 智谱 AI 客户端状态（由 Tauri 管理）
pub struct ZhipuState {
    pub client: Mutex<Option<ZhipuAiClient>>,
}

impl ZhipuState {
    pub fn new() -> Self {
        Self {
            client: Mutex::new(None),
        }
    }
}

/// 简化版 ChatMessage 用于前端传递
#[derive(Debug, Deserialize, Clone)]
pub struct ChatMessageData {
    pub role: String,
    pub content: String,
}

/// 初始化智谱 AI 客户端
#[tauri::command]
#[instrument(skip(state))]
pub async fn init_zhipu_client(
    api_key: String,
    state: tauri::State<'_, ZhipuState>,
) -> Result<String, String> {
    info!("初始化智谱 AI 客户端");

    let client = ZhipuAiClient::new(api_key);
    let mut client_opt = state.client.lock().await;
    *client_opt = Some(client);

    info!("智谱 AI 客户端初始化成功");
    Ok("智谱 AI 已就绪".to_string())
}

/// 发送消息到智谱 AI (支持完整消息数组)
#[tauri::command]
#[instrument(skip(state))]
pub async fn send_message_to_zhipu_with_messages(
    messages: Vec<ChatMessageData>,
    system_prompt: Option<String>,
    model: Option<String>,
    state: tauri::State<'_, ZhipuState>,
) -> Result<serde_json::Value, String> {
    info!("发送消息到智谱 AI，模型：{:?}", model);

    let client_guard = state.client.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;

    // 构建消息历史
    let mut messages_vec = Vec::new();

    let system_content = system_prompt
        .unwrap_or_else(|| "你是一个有用的 AI 编程助手。".to_string());
    messages_vec.push(ChatMessage { role: "system".into(), content: system_content });

    for msg in messages {
        messages_vec.push(ChatMessage { role: msg.role, content: msg.content });
    }

    let selected_model = model.unwrap_or_else(|| models::GLM_4.to_string());

    let request = ChatCompletionRequest {
        model: selected_model.clone(),
        messages: messages_vec,
        temperature: Some(0.7),
        max_tokens: Some(2048),
        stream: Some(false),
        top_p: Some(0.7),
    };

    match client.chat(&request).await {
        Ok(response) => {
            if let Some(choice) = response.choices.first() {
                info!("收到响应 - tokens: 输入={}/输出={}, 总计={}",
                    response.usage.prompt_tokens,
                    response.usage.completion_tokens,
                    response.usage.total_tokens);

                Ok(serde_json::json!({
                    "content": choice.message.content,
                    "model": selected_model,
                    "usage": {
                        "prompt_tokens": response.usage.prompt_tokens,
                        "completion_tokens": response.usage.completion_tokens,
                        "total_tokens": response.usage.total_tokens
                    }
                }))
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
#[instrument(skip(state))]
pub async fn check_zhipu_status(state: tauri::State<'_, ZhipuState>) -> Result<bool, String> {
    let client_guard = state.client.lock().await;
    Ok(client_guard.is_some())
}

/// 获取智谱 AI 模型列表
#[tauri::command]
#[instrument(skip(state, window, app_handle))]
pub async fn fetch_zhipu_models(
    window: tauri::Window,
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, ZhipuState>,
) -> Result<Vec<ModelInfo>, String> {
    info!("请求获取智谱 AI 模型列表");

    let client_guard = state.client.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;

    match client.fetch_models().await {
        Ok(models) => {
            info!("成功获取 {} 个模型", models.len());

            // 保存到配置文件
            if let Ok(mut config) = crate::config::load_app_config(app_handle.clone()).await {
                config.cached_models = models.clone();
                if let Err(e) = crate::config::save_app_config(app_handle, config).await {
                    warn!("保存模型列表到配置文件失败：{}", e);
                } else {
                    info!("模型列表已保存到配置文件");
                }
            }

            let _ = window.emit("models-updated", serde_json::json!({
                "count": models.len(),
                "models": models.iter().map(|m| &m.id).collect::<Vec<_>>()
            }));
            Ok(models)
        }
        Err(e) => {
            warn!("获取模型列表失败，使用缓存数据：{}", e);
            let cached_models = ZhipuAiClient::get_cached_models().await;
            info!("返回缓存的 {} 个模型", cached_models.len());
            Ok(cached_models)
        }
    }
}

/// 处理流式响应
async fn handle_stream_response(
    mut stream: pin::Pin<Box<dyn Stream<Item = Result<String, String>> + Send>>,
    window: tauri::Window,
    selected_model: String,
    start_time: std::time::Instant,
) -> Result<(), String> {
    let mut full_content = String::new();

    while let Some(chunk_result) = stream.next().await {
        match chunk_result {
            Ok(content) => {
                if !content.is_empty() {
                    full_content.push_str(&content);
                    let _ = window.emit("ai-chunk", serde_json::json!({
                        "chunk": content,
                        "full_content": full_content.clone()
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

    let _ = window.emit("ai-complete", serde_json::json!({
        "content": full_content,
        "model": selected_model,
        "execution_time_ms": elapsed as i64
    }));

    Ok(())
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
    state: tauri::State<'_, ZhipuState>,
) -> Result<(), String> {
    info!("发送流式消息到智谱 AI，模型：{:?}", model);

    let start_time = std::time::Instant::now();

    let client_guard = state.client.lock().await;
    let client = client_guard.as_ref().ok_or_else(|| {
        "智谱 AI 客户端未初始化，请先调用 init_zhipu_client".to_string()
    })?;

    let mut messages_vec = Vec::new();

    let system_content = system_prompt
        .unwrap_or_else(|| "你是一个有用的 AI 编程助手。".to_string());
    messages_vec.push(ChatMessage { role: "system".into(), content: system_content });

    for msg in messages {
        messages_vec.push(ChatMessage { role: msg.role, content: msg.content });
    }

    let selected_model = model.unwrap_or_else(|| models::GLM_4.to_string());

    let request = ChatCompletionRequest {
        model: selected_model.clone(),
        messages: messages_vec,
        temperature: temperature.or(Some(0.7)),
        max_tokens: max_tokens.or(Some(2048)),
        stream: Some(true),
        top_p: Some(0.7),
    };

    match client.chat_stream(&request).await {
        Ok(stream) => {
            handle_stream_response(Box::pin(stream), window, selected_model, start_time).await
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

/// 发送流式消息到智谱 AI（简化版，单条消息）
#[tauri::command]
pub async fn send_message_to_zhipu_stream(
    message: String,
    model: Option<String>,
    temperature: Option<f32>,
    max_tokens: Option<i32>,
    system_prompt: Option<String>,
    window: tauri::Window,
    state: tauri::State<'_, ZhipuState>,
) -> Result<(), String> {
    // 复用带上下文版本的逻辑
    let messages = vec![ChatMessageData {
        role: "user".into(),
        content: message,
    }];

    send_message_to_zhipu_stream_with_context(
        messages,
        model,
        temperature,
        max_tokens,
        system_prompt,
        window,
        state,
    )
    .await
}
