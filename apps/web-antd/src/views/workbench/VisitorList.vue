<script lang="ts" setup>
import { ref } from 'vue';

import { IconifyIcon } from '@vben/icons';

import { Badge, Empty, Input, Spin, Tooltip } from 'ant-design-vue';

import { useWorkbenchStore } from './store';

const store = useWorkbenchStore();
const refreshing = ref(false);

/** 判断访客是否在线（兼容字符串枚举 "Online" 和数字 1） */
function isVisitorOnline(status: any): boolean {
  return status === 1 || status === 'Online' || status === true;
}

const fmtTime = (v: string) => {
  if (!v) return '';
  const d = new Date(v);
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');

  if (d.toDateString() === now.toDateString()) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const handleSearch = () => {
  store.loadVisitors(store.searchKeyword);
};

const handleRefresh = async () => {
  refreshing.value = true;
  try {
    await store.loadVisitors(store.searchKeyword);
  } finally {
    refreshing.value = false;
  }
};

/**
 * 获取访客的最后消息预览
 * 优先 previewMap（由 classifyMessage 驱动），兜底 conversation.latestMsg
 */
function getVisitorLastMsg(visitor: any): string {
  const chatUserId = visitor.chatUserId;
  const groupId = visitor.groupId;
  // 会话 key：群聊用 groupId，单聊用 chatUserId
  const key = groupId || chatUserId;
  if (!key) return visitor.remark || '暂无消息';

  // 查找对应 conversation 作为兜底
  const conv = store.imConversations.find((c: any) =>
    groupId ? c.groupID === groupId : c.userID === chatUserId,
  );

  const preview = store.imGetPreviewText(key, conv);
  return preview || visitor.remark || '暂无消息';
}
</script>

<template>
  <div class="visitor-search">
    <Input.Search
      v-model:value="store.searchKeyword"
      placeholder="搜索访客"
      allow-clear
      @search="handleSearch"
      @clear="handleSearch"
    >
      <template #addonBefore>
        <Tooltip title="刷新访客列表">
          <span class="refresh-btn" :class="{ spinning: refreshing }" @click.stop="handleRefresh">
            <IconifyIcon icon="ant-design:reload-outlined" />
          </span>
        </Tooltip>
      </template>
    </Input.Search>
  </div>

  <div class="visitor-list">
    <Spin :spinning="store.visitorLoading">
      <div v-if="!store.visitors.length && !store.visitorLoading" class="visitor-empty">
        <Empty description="暂无访客" />
      </div>
      <div
        v-for="visitor in store.visitors"
        :key="visitor.id"
        class="visitor-item"
        :class="{ active: store.activeVisitor?.id === visitor.id }"
        @click="store.selectVisitor(visitor)"
      >
        <div class="visitor-avatar">
          <Badge :status="isVisitorOnline(visitor.onlineStatus) ? 'success' : 'default'" dot>
            <img
              v-if="visitor.avatar"
              :src="visitor.avatar"
              class="avatar-img"
            />
            <div v-else class="avatar-placeholder">
              {{ (visitor.nicknameRemark || visitor.nickname || '?')[0] }}
            </div>
          </Badge>
        </div>
        <div class="visitor-info">
          <div class="visitor-name">
            {{ visitor.nicknameRemark || visitor.nickname || '匿名用户' }}
          </div>
          <div class="visitor-meta">
            {{ getVisitorLastMsg(visitor) }}
          </div>
        </div>
        <div class="visitor-right">
          <div class="visitor-time">
            {{ fmtTime(visitor.lastActiveTime) }}
          </div>
          <Badge
            v-if="store.getVisitorUnread(visitor) > 0"
            :count="store.getVisitorUnread(visitor)"
            :overflow-count="99"
            class="visitor-unread"
          />
        </div>
      </div>
    </Spin>
  </div>
</template>

<style scoped>
.visitor-search {
  padding: 8px 12px;
  border-bottom: 1px solid hsl(var(--border));
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: hsl(var(--muted-foreground));
  transition: all 0.2s;
  font-size: 14px;
  padding: 2px;
  border-radius: 2px;
}

.refresh-btn:hover {
  color: hsl(var(--primary));
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.refresh-btn.spinning {
  animation: spin 0.8s linear infinite;
  color: hsl(var(--primary));
}

.visitor-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.visitor-list :deep(.ant-spin-nested-loading) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.visitor-list :deep(.ant-spin-container) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.visitor-list :deep(.ant-spin.ant-spin-spinning) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.visitor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visitor-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid hsl(var(--border) / 0.5);
}

.visitor-item:hover {
  background: hsl(var(--accent));
}

.visitor-item.active {
  background: hsl(var(--primary) / 0.1);
}

.visitor-avatar {
  flex-shrink: 0;
  margin-right: 10px;
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

.visitor-info {
  flex: 1;
  min-width: 0;
}

.visitor-name {
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visitor-meta {
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 2px;
}

.visitor-right {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: 8px;
}

.visitor-time {
  font-size: 11px;
  color: hsl(var(--muted-foreground));
  opacity: 0.7;
}

.visitor-unread :deep(.ant-badge-count) {
  font-size: 10px;
  min-width: 16px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}
</style>
