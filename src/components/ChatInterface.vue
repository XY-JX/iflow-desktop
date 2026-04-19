<template>
  <div class="chat-interface">
    <!-- 消息列表 -->
    <MessageList
      :messages="messages"
      :is-generating="isGenerating"
      @reply-to-message="handleReplyToMessage"
    />

    <!-- 输入区域 -->
    <InputArea
      :is-generating="isGenerating"
      @send-message="handleSendMessage"
      @clear-conversation="$emit('clear-conversation')"
      @export-conversation="$emit('export-conversation')"
      @export-pdf="$emit('export-pdf')"
      @copy-last-answer="$emit('copy-last-answer')"
      @apply-template="$emit('apply-template', $event)"
      @save-code-snippet="handleSaveCodeSnippet"
    />
  </div>
</template>

<script setup lang="ts">
import { showWarning } from '../utils/message';
import MessageList from './MessageList.vue';
import InputArea from './InputArea.vue';
import type { Message, Model } from '../types';

interface Props {
  messages: Message[];
  isGenerating: boolean;
  availableModels: Model[];
  currentModel: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'send-message': [content: string];
  'model-change': [modelId: string];
  'clear-conversation': [];
  'export-conversation': [];
  'export-pdf': [];
  'copy-last-answer': [];
  'apply-template': [type: string];
  'save-code-snippet': [code: string, language: string];
  'reply-to-message': [messageId: string];
}>();

function handleSendMessage(content: string) {
  emit('send-message', content);
}

function handleReplyToMessage(message: Message) {
  emit('reply-to-message', message.id);
}

function extractCodeBlocks(content: string): Array<{ code: string; language: string }> {
  const codeBlocks: Array<{ code: string; language: string }> = [];
  const regex = /```(\w+)?\s*\n([\s\S]*?)```/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    codeBlocks.push({
      language: match[1] || 'text',
      code: match[2].trim()
    });
  }

  return codeBlocks;
}

function handleSaveCodeSnippet() {
  const assistantMessages = props.messages.filter((m) => m.role === 'assistant');
  if (assistantMessages.length === 0) {
    showWarning('没有找到助手的消息');
    return;
  }

  const lastMessage = assistantMessages[assistantMessages.length - 1];
  const codeBlocks = extractCodeBlocks(lastMessage.content);

  if (codeBlocks.length === 0) {
    showWarning('该消息中没有找到代码块');
    return;
  }

  const firstBlock = codeBlocks[0];
  emit('save-code-snippet', firstBlock.code, firstBlock.language);
}
</script>

<style scoped>
.chat-interface {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>
