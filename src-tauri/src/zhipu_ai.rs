use reqwest::{Client};
use serde::{Deserialize, Serialize};
use tokio_stream::StreamExt;
use tracing::{info, warn, error};

/// 智谱 AI API 客户端
pub struct ZhipuAiClient {
    client: Client,
    api_key: String,
    base_url: String,
}

/// 消息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

/// 聊天完成请求参数
#[derive(Debug, Serialize)]
pub struct ChatCompletionRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_tokens: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stream: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub top_p: Option<f32>,
}

/// 聊天完成响应
#[derive(Debug, Deserialize)]
pub struct ChatCompletionResponse {
    pub id: String,
    pub model: String,
    pub choices: Vec<Choice>,
    pub usage: Usage,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub index: i32,
    pub message: ChatMessage,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Usage {
    pub prompt_tokens: i32,
    pub completion_tokens: i32,
    pub total_tokens: i32,
}

/// 流式响应块
#[derive(Debug, Deserialize)]
pub struct StreamChunk {
    pub id: String,
    pub model: String,
    pub choices: Vec<StreamChoice>,
}

#[derive(Debug, Deserialize)]
pub struct StreamChoice {
    pub index: i32,
    pub delta: Delta,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct Delta {
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub content: Option<String>,
    #[serde(default)]
    pub reasoning_content: Option<String>,
}

impl ZhipuAiClient {
    /// 创建新的客户端实例
    pub fn new(api_key: String) -> Self {
        let client = Client::new();
        let base_url = "https://open.bigmodel.cn/api/paas/v4".to_string();
        
        info!("智谱 AI 客户端已初始化");
        
        Self {
            client,
            api_key,
            base_url,
        }
    }

    /// 发送聊天请求 (非流式)
    pub async fn chat(&self, request: &ChatCompletionRequest) -> Result<ChatCompletionResponse, String> {
        let url = format!("{}/chat/completions", self.base_url);
        
        info!("发送聊天请求到模型：{}", request.model);
        
        let response = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(request)
            .send()
            .await
            .map_err(|e| {
                error!("HTTP 请求失败：{}", e);
                format!("请求失败：{}", e)
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("API 返回错误：{} - {}", status, error_text);
            return Err(format!("API 错误：{} - {}", status, error_text));
        }

        let result = response.json::<ChatCompletionResponse>().await.map_err(|e| {
            error!("解析响应失败：{}", e);
            format!("解析失败：{}", e)
        })?;

        info!("聊天完成，使用 tokens: {}", result.usage.total_tokens);
        
        Ok(result)
    }

    /// 发送流式聊天请求
    pub async fn chat_stream(
        &self,
        request: &ChatCompletionRequest,
    ) -> Result<impl futures_core::stream::Stream<Item = Result<String, String>>, String> {
        let url = format!("{}/chat/completions", self.base_url);
        
        info!("发送流式聊天请求到模型：{}", request.model);
        
        let request_builder = self.client
            .post(&url)
            .header("Content-Type", "application/json")
            .header("Authorization", format!("Bearer {}", self.api_key))
            .json(request);

        let response = request_builder
            .send()
            .await
            .map_err(|e| {
                error!("HTTP 请求失败：{}", e);
                format!("请求失败：{}", e)
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("API 返回错误：{} - {}", status, error_text);
            return Err(format!("API 错误：{} - {}", status, error_text));
        }

        let stream = response.bytes_stream().then(|chunk| async move {
            match chunk {
                Ok(bytes) => {
                    let text = String::from_utf8_lossy(&bytes);
                    // 处理可能的多行数据
                    let mut results = Vec::new();
                    
                    for line in text.lines() {
                        let line = line.trim();
                        if line.is_empty() {
                            continue;
                        }
                        
                        // SSE 格式：data: {...}
                        if let Some(data) = line.strip_prefix("data: ") {
                            if data.trim() == "[DONE]" {
                                continue;
                            }
                            
                            match serde_json::from_str::<StreamChunk>(data) {
                                Ok(chunk) => {
                                    if let Some(choice) = chunk.choices.first() {
                                        // 只使用 reasoning_content (思考过程)
                                        // 如果有 reasoning_content，就忽略 content
                                        if let Some(content) = &choice.delta.reasoning_content {
                                            if !content.is_empty() {
                                                results.push(content.clone());
                                            }
                                        } else if choice.delta.reasoning_content.is_none() {
                                            // 只有在没有 reasoning_content 时才使用 content
                                            if let Some(content) = &choice.delta.content {
                                                if !content.is_empty() {
                                                    results.push(content.clone());
                                                }
                                            }
                                        }
                                    }
                                }
                                Err(e) => {
                                    warn!("解析流式数据失败：{} - {}", e, data);
                                    // 忽略解析错误，继续处理
                                }
                            }
                        }
                    }
                    
                    // 返回所有解析出的内容
                    Ok(results.join(""))
                }
                Err(e) => {
                    error!("读取流式数据失败：{}", e);
                    Err(format!("读取失败：{}", e))
                }
            }
        });

        info!("流式响应已开始");
        
        Ok(stream)
    }
}

/// 支持的智谱 AI 模型列表
pub mod models {
    pub const GLM_4_6V: &str = "glm-4.6v";
    pub const GLM_4_5_AIR: &str = "glm-4.5-air";
    pub const GLM_4: &str = "glm-4";
    pub const GLM_4_FLASH: &str = "glm-4-flash";
}
