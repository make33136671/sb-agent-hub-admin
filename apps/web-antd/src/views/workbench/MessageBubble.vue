<script lang="ts" setup>
import { computed } from 'vue';

import dayjs from 'dayjs';
import { IconifyIcon } from '@vben/icons';

import { MessageStatus, MessageType, type Message } from '@saiboniuma/realtime-core';

const props = defineProps<{
  message: Message;
  isSelf: boolean;
  senderAvatar?: string;
}>();

const avatarUrl = computed(() => props.message.senderFaceUrl || props.senderAvatar || '');

const time = computed(() => {
  const ts = props.message.sendTime || props.message.createTime;
  if (!ts) return '';
  return dayjs(ts).format('HH:mm');
});

const isImage = computed(
  () => Number(props.message.contentType) === MessageType.PictureMessage,
);

const textContent = computed(() => {
  if (props.message.textElem?.content) {
    return props.message.textElem.content;
  }
  // 兼容 content 字段
  if (Number(props.message.contentType) === MessageType.TextMessage) {
    try {
      const parsed = JSON.parse(props.message.content);
      return parsed.content || props.message.content;
    } catch {
      return props.message.content;
    }
  }
  return props.message.content;
});

const imageUrl = computed(() => {
  if (!isImage.value) return '';
  const elem = props.message.pictureElem;
  return (
    elem?.snapshotPicture?.url ||
    elem?.sourcePicture?.url ||
    elem?.bigPicture?.url ||
    ''
  );
});

const msgStatus = computed(() => {
  const s = props.message.status;
  if (s === MessageStatus.Sending) return 'sending';
  if (s === MessageStatus.Failed) return 'failed';
  if (props.message.isRead) return 'read';
  return 'success';
});
</script>

<template>
  <div class="message-bubble" :class="{ 'is-self': isSelf }">
    <div class="bubble-row" :class="{ 'bubble-row-self': isSelf }">
      <!-- 头像（对方在左） -->
      <div v-if="!isSelf" class="bubble-avatar">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
        <div v-else class="avatar-placeholder">
          {{ (message.senderNickname || '?')[0] }}
        </div>
      </div>

      <div class="bubble-main" :class="{ 'bubble-main-self': isSelf }">
        <!-- 昵称 -->
        <div class="bubble-sender" :class="{ 'bubble-sender-self': isSelf }">
          {{ message.senderNickname || message.sendID }}
        </div>
        <div class="bubble-content" :class="isSelf ? 'bubble-self' : 'bubble-other'">
          <!-- 图片消息 -->
          <img
            v-if="isImage && imageUrl"
            :src="imageUrl"
            class="bubble-image"
            alt="图片"
          />
          <!-- 文本消息 -->
          <span v-else class="bubble-text">{{ textContent }}</span>
        </div>
        <div class="bubble-footer" :class="{ 'bubble-footer-self': isSelf }">
          <span class="bubble-time">{{ time }}</span>
          <!-- 自己发送的消息显示状态 -->
          <span v-if="isSelf" class="msg-status" :class="`msg-status-${msgStatus}`">
            <IconifyIcon v-if="msgStatus === 'sending'" icon="ant-design:loading-outlined" class="msg-status-icon spinning" />
            <span v-else-if="msgStatus === 'failed'" class="msg-status-circle msg-status-circle-failed">
              <IconifyIcon icon="ant-design:close-outlined" class="msg-status-icon-inner" />
            </span>
            <span v-else-if="msgStatus === 'read'" class="msg-status-circle msg-status-circle-success">
              <IconifyIcon icon="lucide:check-check" class="msg-status-icon-inner" />
            </span>
            <span v-else class="msg-status-circle msg-status-circle-success">
              <IconifyIcon icon="lucide:check" class="msg-status-icon-inner" />
            </span>
          </span>
        </div>
      </div>

      <!-- 头像（自己在右） -->
      <div v-if="isSelf" class="bubble-avatar">
        <img v-if="avatarUrl" :src="avatarUrl" class="avatar-img" />
        <div v-else class="avatar-placeholder avatar-placeholder-self">
          {{ (message.senderNickname || '我')[0] }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.message-bubble {
  margin-bottom: 16px;
  max-width: 75%;
}

.message-bubble.is-self {
  margin-left: auto;
}

.bubble-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.bubble-row-self {
  justify-content: flex-end;
}

.bubble-avatar {
  flex-shrink: 0;
  margin-top: 2px;
}

.avatar-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
}

.avatar-placeholder-self {
  background: #1677ff;
  color: #fff;
}

.bubble-main {
  min-width: 0;
}

.bubble-main-self {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.bubble-sender {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-bottom: 2px;
  padding-left: 4px;
}

.bubble-sender-self {
  padding-left: 0;
  padding-right: 4px;
}

.bubble-content {
  padding: 8px 12px;
  border-radius: 8px;
  word-break: break-word;
  line-height: 1.5;
}

.bubble-self {
  background: #1677ff;
  color: #fff;
  border-bottom-right-radius: 2px;
}

.bubble-other {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
  border-bottom-left-radius: 2px;
}

.bubble-text {
  white-space: pre-wrap;
}

.bubble-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 4px;
  display: block;
}

.bubble-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding-left: 4px;
}

.bubble-footer-self {
  justify-content: flex-end;
  padding-left: 0;
  padding-right: 4px;
}

.bubble-time {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
}

.msg-status {
  display: inline-flex;
  align-items: center;
  line-height: 1;
}

.msg-status-icon {
  font-size: 14px;
}

.msg-status-sending {
  color: hsl(var(--muted-foreground));
}

.msg-status-circle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: #fff;
}

.msg-status-circle-success {
  background: #4caf50;
}

.msg-status-circle-failed {
  background: #f44336;
}

.msg-status-icon-inner {
  font-size: 10px;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
