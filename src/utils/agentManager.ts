import { useAgentStore } from '../stores/agentStore';
import { info, error as logError } from './logger';

export interface AgentTask {
  id: string;
  type: 'commander' | 'code_expert' | 'reviewer';
  prompt: string;
  model?: string;
}

export interface AgentResult {
  taskId: string;
  content: string;
  success: boolean;
  error?: string;
}

/**
 * 指挥官 Agent - 任务分析和分解
 */
export async function commanderAgent(task: string): Promise<string> {
  const agentStore = useAgentStore();
  const apiKey = agentStore.getCommanderApiKey();
  
  if (!apiKey) {
    throw new Error('指挥官 API Key 未配置');
  }

  agentStore.updateAgentStatus('commander', 'working', '正在分析任务...');

  const systemPrompt = `你是一个智能任务指挥官。你的职责是:
1. 分析用户的复杂任务
2. 将任务分解为清晰的子任务
3. 为每个子任务指定执行策略
4. 输出结构化的执行计划

请以以下格式回复:
## 任务分析
[分析用户需求]

## 执行计划
1. [子任务1]
2. [子任务2]
...

## 建议模型
- 代码生成: [推荐模型]
- 代码审查: [推荐模型]`;

  try {
    const result = await callZhipuAI({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task }
      ],
      model: agentStore.agentConfigs?.default_commander_model || 'glm-4',
    });

    agentStore.updateAgentStatus('commander', 'completed', '任务分析完成');
    return result;
  } catch (error) {
    agentStore.updateAgentStatus('commander', 'error', String(error));
    throw error;
  }
}

/**
 * 代码专家 Agent - 代码生成
 */
export async function codeExpertAgent(task: string, context?: string): Promise<string> {
  const agentStore = useAgentStore();
  const apiKey = agentStore.getCodeExpertApiKey() || agentStore.getCommanderApiKey();
  
  if (!apiKey) {
    throw new Error('代码专家 API Key 未配置');
  }

  agentStore.updateAgentStatus('code_expert', 'working', '正在生成代码...');

  const systemPrompt = `你是一个专业的代码生成专家。你的职责是:
1. 根据需求生成高质量、可维护的代码
2. 遵循最佳实践和编码规范
3. 添加必要的注释和文档
4. 考虑边界情况和错误处理

${context ? `\n上下文信息:\n${context}` : ''}`;

  try {
    const result = await callZhipuAI({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task }
      ],
      model: agentStore.agentConfigs?.default_code_model || 'glm-4',
    });

    agentStore.updateAgentStatus('code_expert', 'completed', '代码生成完成');
    return result;
  } catch (error) {
    agentStore.updateAgentStatus('code_expert', 'error', String(error));
    throw error;
  }
}

/**
 * 审查 Agent - 代码审查和优化建议
 */
export async function reviewerAgent(code: string, requirements?: string): Promise<string> {
  const agentStore = useAgentStore();
  const apiKey = agentStore.getReviewerApiKey() || agentStore.getCommanderApiKey();
  
  if (!apiKey) {
    throw new Error('审查 API Key 未配置');
  }

  agentStore.updateAgentStatus('reviewer', 'working', '正在审查代码...');

  const systemPrompt = `你是一个严格的代码审查专家。请从以下维度审查代码:

## 审查维度
1. **代码质量**: 可读性、可维护性、命名规范
2. **性能优化**: 算法复杂度、资源使用
3. **安全性**: 潜在漏洞、输入验证
4. **最佳实践**: 设计模式、架构合理性

## 输出格式
### ✅ 优点
- [列出优点]

### ⚠️ 问题
- [列出问题及严重程度]

### 💡 改进建议
- [具体改进方案]

${requirements ? `\n需求说明:\n${requirements}` : ''}`;

  try {
    const result = await callZhipuAI({
      apiKey,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: code }
      ],
      model: 'glm-4',
    });

    agentStore.updateAgentStatus('reviewer', 'completed', '代码审查完成');
    return result;
  } catch (error) {
    agentStore.updateAgentStatus('reviewer', 'error', String(error));
    throw error;
  }
}

/**
 * 多 Agent 协作工作流
 */
export async function multiAgentWorkflow(userTask: string): Promise<{
  analysis: string;
  code?: string;
  review?: string;
}> {
  const agentStore = useAgentStore();
  agentStore.resetAgentStatuses();

  try {
    // 阶段 1: 指挥官分析任务
    info('multiAgent', '阶段 1: 任务分析');
    const analysis = await commanderAgent(userTask);

    // 阶段 2: 代码专家生成代码
    info('multiAgent', '阶段 2: 代码生成');
    const code = await codeExpertAgent(userTask, analysis);

    // 阶段 3: 审查 Agent 审查代码
    info('multiAgent', '阶段 3: 代码审查');
    const review = await reviewerAgent(code, userTask);

    return {
      analysis,
      code,
      review,
    };
  } catch (error) {
    logError('multiAgent', '工作流执行失败:', error);
    throw error;
  }
}

/**
 * 调用智谱 AI API
 */
async function callZhipuAI(params: {
  apiKey: string;
  messages: Array<{ role: string; content: string }>;
  model: string;
}): Promise<string> {
  const { invoke } = await import('@tauri-apps/api/core');
  
  try {
    // 初始化客户端
    await invoke('init_zhipu_client', { apiKey: params.apiKey });
    
    // 发送请求(非流式)
    const response = await invoke<any>('send_message_to_zhipu', {
      message: params.messages[params.messages.length - 1].content,
      model: params.model,
    });
    
    return response.content || '';
  } catch (error) {
    logError('zhipuAI', `API 调用失败:`, error);
    throw error;
  }
}
