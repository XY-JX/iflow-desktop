/**
 * 消息提示工具
 * 封装 Naive UI 的 message 组件
 */

import { useMessage, useDialog, useNotification } from 'naive-ui';
import type { MessageApi, DialogApi, NotificationApi } from 'naive-ui';

// 全局 API 实例（需要在 App 中初始化）
let messageApi: MessageApi | null = null;
let dialogApi: DialogApi | null = null;
let notificationApi: NotificationApi | null = null;

/**
 * 初始化消息 API
 */
export function initMessageAPI(message: MessageApi, dialog: DialogApi, notification: NotificationApi) {
  messageApi = message;
  dialogApi = dialog;
  notificationApi = notification;
}

/**
 * 成功提示
 */
export function showSuccess(content: string, duration = 3000) {
  messageApi?.success(content, { duration });
}

/**
 * 错误提示
 */
export function showError(content: string, duration = 5000) {
  messageApi?.error(content, { duration });
}

/**
 * 警告提示
 */
export function showWarning(content: string, duration = 3000) {
  messageApi?.warning(content, { duration });
}

/**
 * 信息提示
 */
export function showInfo(content: string, duration = 3000) {
  messageApi?.info(content, { duration });
}

/**
 * 加载提示
 */
export function showLoading(content: string = '加载中...') {
  messageApi?.loading(content, { duration: 0 });
}

/**
 * 隐藏所有消息
 */
export function hideAllMessages() {
  messageApi?.destroyAll();
}

/**
 * 确认对话框
 */
export function showConfirm(
  title: string,
  content: string,
  onPositive: () => void,
  onNegative?: () => void
) {
  dialogApi?.warning({
    title,
    content,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: onPositive,
    onNegativeClick: onNegative,
  });
}

/**
 * 删除确认对话框
 */
export function showDeleteConfirm(
  itemName: string,
  onConfirm: () => void
) {
  dialogApi?.error({
    title: '确认删除',
    content: `确定要删除 "${itemName}" 吗？此操作不可恢复！`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: onConfirm,
  });
}

/**
 * 通知提示
 */
export function showNotification(
  title: string,
  content: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info',
  duration = 4000
) {
  notificationApi?.[type]({
    title,
    content,
    duration,
  });
}
