use reqwest::Client;
use serde::{Deserialize, Serialize};
use tracing::{info, error, warn};
use std::sync::Arc;
use tokio::sync::Mutex;

/// 智谱 AI API 客户端
pub struct ZhipuAiClient {
    client: Client,
    api_key: String,
    base_url: String,
}

/// 全局模型列表缓存
static MODEL_CACHE: once_cell::sync::Lazy<Arc<Mutex<Vec<ModelInfo>>>> =
    once_cell::sync::Lazy::new(|| Arc::new(Mutex::new(get_default_models())));

/// 默认模型列表（备用）
fn get_default_models() -> Vec<ModelInfo> {
    vec![
        ModelInfo { id: "glm-4.6v".into(), name: Some("GLM-4.6V".into()), description: Some("最新视觉语言模型".into()) },
        ModelInfo { id: "glm-4.5-air".into(), name: Some("GLM-4.5-Air".into()), description: Some("轻量级高效模型".into()) },
        ModelInfo { id: "glm-4".into(), name: Some("GLM-4".into()), description: Some("通用对话模型".into()) },
        ModelInfo { id: "glm-4-flash".into(), name: Some("GLM-4-Flash".into()), description: Some("快速响应模型".into()) },
    ]
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

/// 模型信息结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInfo {
    pub id: String,
    pub name: Option<String>,
    pub description: Option<String>,
}

/// 模型列表响应
#[derive(Debug, Deserialize)]
pub struct ModelsResponse {
    pub data: Vec<ModelInfo>,
}

/// 解析 SSE 数据行，返回提取的内容
fn parse_sse_line(line: &str) -> Option<String> {
    let line = line.trim();
    if line.is_empty() {
        return None;
    }

    // 提取 data: 前缀
    let data = line.strip_prefix("data: ")
        .or_else(|| line.strip_prefix("data:"))?;

    let data = data.trim();
    if data == "[DONE]" {
        return None;
    }

    // 解析 JSON
    let chunk: StreamChunk = match serde_json::from_str(data) {
        Ok(c) => c,
        Err(e) => {
            warn!("解析 chunk 失败: {}, data: {}", e, data);
            return None;
        }
    };

    let choice = chunk.choices.first()?;

    // 优先使用 reasoning_content (思考过程)，否则使用 content
    if let Some(reasoning) = &choice.delta.reasoning_content {
        if !reasoning.is_empty() {
            return Some(reasoning.clone());
        }
    }

    if let Some(content) = &choice.delta.content {
        if !content.is_empty() {
            return Some(content.clone());
        }
    }

    None
}

impl ZhipuAiClient {
    /// 创建新的客户端实例
    pub fn new(api_key: String) -> Self {
        info!("智谱 AI 客户端已初始化");
        Self {
            client: Client::new(),
            api_key,
            base_url: "https://open.bigmodel.cn/api/paas/v4".into(),
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

        use tokio_stream::StreamExt;

        let buffer = Arc::new(Mutex::new(String::new()));

        let stream = response.bytes_stream().then({
            let buffer = buffer.clone();
            move |chunk| {
                let buffer = buffer.clone();
                async move {
                    match chunk {
                        Ok(bytes) => {
                            let text = String::from_utf8_lossy(&bytes);
                            let mut buf = buffer.lock().await;
                            buf.push_str(&text);

                            let current_buf = buf.clone();
                            let lines: Vec<&str> = current_buf.split('\n').collect();
                            let line_count = lines.len();

                            let mut results = Vec::new();

                            for (i, line) in lines.iter().enumerate() {
                                // 最后一行可能是不完整的，保留到 buffer
                                if i == line_count - 1 && !current_buf.ends_with('\n') {
                                    *buf = line.to_string();
                                    break;
                                }

                                if let Some(content) = parse_sse_line(line) {
                                    results.push(content);
                                }
                            }

                            if current_buf.ends_with('\n') {
                                buf.clear();
                            }

                            Ok(results.join(""))
                        }
                        Err(e) => {
                            error!("读取流式数据失败：{}", e);
                            Err(format!("读取失败：{}", e))
                        }
                    }
                }
            }
        });

        info!("流式响应已开始");
        Ok(stream)
    }

    /// 获取模型列表（动态从 API 获取）
    pub async fn fetch_models(&self) -> Result<Vec<ModelInfo>, String> {
        let url = format!("{}/models", self.base_url);
        info!("正在获取智谱 AI 模型列表...");

        let response = self.client
            .get(&url)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await
            .map_err(|e| {
                error!("获取模型列表失败：{}", e);
                format!("请求失败：{}", e)
            })?;

        if !response.status().is_success() {
            let status = response.status();
            let error_text = response.text().await.unwrap_or_default();
            error!("API 返回错误：{} - {}", status, error_text);
            return Err(format!("API 错误：{} - {}", status, error_text));
        }

        let models_response: ModelsResponse = response.json().await.map_err(|e| {
            error!("解析模型列表失败：{}", e);
            format!("解析失败：{}", e)
        })?;

        info!("成功获取 {} 个模型", models_response.data.len());

        // 补充缺失的名称和描述
        let enriched_models: Vec<ModelInfo> = models_response.data.iter().map(|model| {
            let name = model.name.clone().or_else(|| match model.id.as_str() {
                "glm-4.5" => Some("GLM-4.5".into()),
                "glm-4.5-air" => Some("GLM-4.5 Air".into()),
                "glm-4.6" => Some("GLM-4.6".into()),
                "glm-4.7" => Some("GLM-4.7".into()),
                "glm-5" => Some("GLM-5".into()),
                "glm-5-turbo" => Some("GLM-5 Turbo".into()),
                "glm-5.1" => Some("GLM-5.1".into()),
                "glm-4.6v" => Some("GLM-4.6V".into()),
                "glm-4" => Some("GLM-4".into()),
                "glm-4-flash" => Some("GLM-4 Flash".into()),
                _ => None,
            });

            let description = model.description.clone().or_else(|| match model.id.as_str() {
                "glm-4.5" => Some("高性能通用模型".into()),
                "glm-4.5-air" => Some("轻量级高效模型".into()),
                "glm-4.6" => Some("最新通用模型".into()),
                "glm-4.7" => Some("增强版模型".into()),
                "glm-5" => Some("下一代旗舰模型".into()),
                "glm-5-turbo" => Some("快速响应版本".into()),
                "glm-5.1" => Some("优化版模型".into()),
                "glm-4.6v" => Some("视觉语言模型".into()),
                "glm-4" => Some("经典通用模型".into()),
                "glm-4-flash" => Some("极速响应模型".into()),
                _ => Some("智谱 AI 模型".into()),
            });

            ModelInfo { id: model.id.clone(), name, description }
        }).collect();

        // 更新全局缓存
        let mut cache = MODEL_CACHE.lock().await;
        *cache = enriched_models.clone();

        Ok(enriched_models)
    }

    /// 获取缓存的模型列表
    pub async fn get_cached_models() -> Vec<ModelInfo> {
        let cache = MODEL_CACHE.lock().await;
        cache.clone()
    }
}

/// 支持的智谱 AI 模型列表
pub mod models {
    pub const GLM_4_6V: &str = "glm-4.6v";
    pub const GLM_4_5_AIR: &str = "glm-4.5-air";
    pub const GLM_4: &str = "glm-4";
    pub const GLM_4_FLASH: &str = "glm-4-flash";
}
