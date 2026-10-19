<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';

import { Alert, Button, Empty, Input, Popover as APopover, message } from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import { isDisplayableSystemMessage, getSystemMessageLabel } from '@sb/realtime-core';
import dayjs from 'dayjs';

import { useWorkbenchStore } from './store';
import MessageBubble from './MessageBubble.vue';

const store = useWorkbenchStore();

/** 获取消息发送者头像：消息自带 > senderInfoMap > 访客/当前客服兜底 */
function getSenderAvatar(msg: any): string {
  if (msg.senderFaceUrl) return msg.senderFaceUrl;
  const cached = store.imSenderInfoMap.get(msg.sendID);
  if (cached?.faceURL) return cached.faceURL;
  // 兜底
  if (msg.sendID === store.activeVisitor?.chatUserId) return store.activeVisitor?.avatar || '';
  return store.agentAvatar;
}

const messageText = ref('');
const messagesContainer = ref<HTMLElement | null>(null);
const showEmojiPicker = ref(false);

const emojiList = [
  '😀','😃','😄','😁','😆','😅','🤣','😂',
  '🙂','😊','😇','🥰','😍','🤩','😘','😗',
  '😚','😋','😛','😜','🤪','😝','🤑','🤗',
  '🤭','🤫','🤔','🤐','🤨','😐','😑','😶',
  '😏','😒','🙄','😬','😮‍💨','🤥','😌','😔',
  '😪','🤤','😴','😷','🤒','🤕','🤢','🤮',
  '🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳',
  '😎','🤓','🧐','😕','😟','🙁','☹️','😮',
  '😯','😲','😳','🥺','😦','😧','😨','😰',
  '😥','😢','😭','😱','😖','😣','😞','😓',
  '👍','👎','👌','🤌','🤏','✌️','🤞','🤟',
  '🤘','🤙','👈','👉','👆','👇','☝️','👋',
  '🤚','🖐️','✋','🖖','👏','🙌','🤝','🙏',
  '❤️','🧡','💛','💚','💙','💜','🖤','🤍',
  '💔','❣️','💕','💞','💓','💗','💖','💘',
  '⭐','✨','🌟','💫','🔥','💯','✅','❌',
  '❓','❗','💤','💬','👀','🎉','🎊','🎁',
];

const hasActiveVisitor = computed(() => !!store.activeVisitor);

const visitorName = computed(() => {
  if (!store.activeVisitor) return '';
  return (
    store.activeVisitor.nicknameRemark ||
    store.activeVisitor.nickname ||
    '匿名用户'
  );
});

const inputDisabled = computed(() => !store.imConnected);

// 切换访客 或 IM 连接成功时 加载聊天记录
watch(
  () => [store.activeVisitor?.chatUserId, store.imConnected] as const,
  async ([chatUserId, connected]) => {
    if (chatUserId && connected) {
      try {
        const groupId = store.getVisitorGroupId(store.activeVisitor);
        if (groupId) {
          await store.imLoadHistory(groupId, 100, 3, String(chatUserId));
        } else {
          await store.imLoadHistory(String(chatUserId));
        }
        scrollToBottom();
      } catch {
        // IM 销毁或退出中，忽略
      }
    }
  },
);

// 消息数量变化时滚动到底部
watch(
  () => store.imMessages.length,
  () => {
    nextTick(() => scrollToBottom());
  },
);

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop =
        messagesContainer.value.scrollHeight;
    }
  });
}

const handleSend = async () => {
  const text = messageText.value.trim();
  if (!text) return;

  const chatUserId = store.activeVisitor?.chatUserId;
  if (!chatUserId) return;

  const groupId = store.getVisitorGroupId(store.activeVisitor);
  messageText.value = '';
  try {
    if (groupId) {
      await store.imSendText(groupId, text, true);
    } else {
      await store.imSendText(String(chatUserId), text);
    }
  } catch {
    message.error('发送失败');
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
};

function insertEmoji(emoji: string) {
  messageText.value += emoji;
  showEmojiPicker.value = false;
}

async function handleImageSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  input.value = '';

  const chatUserId = store.activeVisitor?.chatUserId;
  if (!chatUserId) return;

  const groupId = store.getVisitorGroupId(store.activeVisitor);
  try {
    if (groupId) {
      await store.imSendImage(groupId, file, true);
    } else {
      await store.imSendImage(String(chatUserId), file);
    }
  } catch {
    message.error('图片发送失败');
  }
}
</script>

<template>
  <div v-if="hasActiveVisitor" class="chat-panel">
    <!-- 头部 -->
    <div class="chat-header">
      <div class="chat-header-name">{{ visitorName }}</div>
      <div class="chat-header-id">{{ store.activeVisitor?.chatUserId }}</div>
      <span v-if="store.activeVisitor?.groupId" class="broadcast-badge">广播接待</span>
    </div>

    <!-- IM 未连接提示 -->
    <Alert
      v-if="inputDisabled"
      message="IM 未连接，请先切换到在线状态"
      type="warning"
      show-icon
      banner
    />

    <!-- 消息区域 -->
    <div ref="messagesContainer" class="chat-messages">
      <template v-if="store.imMessages.length > 0">
        <template v-for="msg in store.imMessages" :key="msg.clientMsgID">
          <!-- 系统消息：居中显示 -->
          <div v-if="isDisplayableSystemMessage(msg)" class="system-message">
            <span class="system-message-text">{{ getSystemMessageLabel(msg) }}</span>
            <span class="system-message-time">{{ dayjs(msg.sendTime || msg.createTime).format('HH:mm') }}</span>
          </div>
          <!-- 普通消息：气泡 -->
          <MessageBubble
            v-else
            :message="msg"
            :is-self="msg.sendID !== store.activeVisitor?.chatUserId"
            :sender-avatar="getSenderAvatar(msg)"
          />
        </template>
      </template>
      <template v-else>
        <div class="chat-messages-empty">
          <p>暂无消息</p>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="chat-toolbar">
        <!-- 表情按钮 -->
        <APopover v-model:open="showEmojiPicker" trigger="click" placement="topLeft">
          <template #content>
            <div class="emoji-grid">
              <span
                v-for="emoji in emojiList"
                :key="emoji"
                class="emoji-item"
                @click="insertEmoji(emoji)"
              >{{ emoji }}</span>
            </div>
          </template>
          <Button type="text" :disabled="inputDisabled" title="表情">
            <IconifyIcon icon="ant-design:smile-outlined" />
          </Button>
        </APopover>
        <!-- 图片按钮（用 label 关联 input，确保原生用户手势触发文件选择器） -->
        <label class="image-upload-label" :class="{ disabled: inputDisabled }">
          <IconifyIcon icon="ant-design:picture-outlined" />
          <input
            type="file"
            accept="image/*"
            :disabled="inputDisabled"
            @change="handleImageSelected"
          />
        </label>
      </div>
      <div class="chat-input-area">
        <Input.TextArea
          v-model:value="messageText"
          :placeholder="inputDisabled ? 'IM 未连接' : '输入消息，Enter 发送，Shift+Enter 换行'"
          :auto-size="{ minRows: 3, maxRows: 6 }"
          :disabled="inputDisabled"
          @keydown="handleKeyDown"
        />
      </div>
      <div class="chat-input-footer">
        <Button
          type="primary"
          :disabled="inputDisabled || !messageText.trim()"
          @click="handleSend"
        >
          发送
        </Button>
      </div>
    </div>
  </div>

  <div v-else class="chat-empty">
    <Empty description="请从左侧选择一个访客开始对话" />
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-header {
  padding: 12px 16px;
  border-bottom: 1px solid hsl(var(--border));
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-header-name {
  font-size: 15px;
  font-weight: 500;
  color: hsl(var(--foreground));
}

.chat-header-id {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.broadcast-badge {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #e6f7ff;
  color: #1890ff;
  border: 1px solid #91d5ff;
  white-space: nowrap;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background: hsl(var(--background));
}

.chat-messages-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: hsl(var(--muted-foreground));
}

.system-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin: 12px 0;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
}

.system-message::before,
.system-message::after {
  content: '';
  flex: 0 0 32px;
  height: 1px;
  background: hsl(var(--border));
}

.system-message-time {
  font-size: 11px;
  opacity: 0.7;
}

.chat-input {
  border-top: 1px solid hsl(var(--border));
  background: hsl(var(--card));
}

.chat-toolbar {
  padding: 8px 16px 0;
  display: flex;
  gap: 8px;
}

.chat-input-area {
  padding: 8px 16px;
}

.chat-input-footer {
  padding: 0 16px 8px;
  display: flex;
  justify-content: flex-end;
}

.chat-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.image-upload-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  color: hsl(var(--foreground));
  transition: background 0.15s;
  position: relative;
  overflow: hidden;
}

.image-upload-label:hover:not(.disabled) {
  background: rgba(0, 0, 0, 0.06);
}

.image-upload-label.disabled {
  cursor: not-allowed;
  opacity: 0.4;
  pointer-events: none;
}

.image-upload-label input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
  max-height: 240px;
  overflow-y: auto;
  width: 320px;
}

.emoji-item {
  font-size: 24px;
  cursor: pointer;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
  transition: background 0.15s;
}

.emoji-item:hover {
  background: rgba(0, 0, 0, 0.06);
}

</style>
