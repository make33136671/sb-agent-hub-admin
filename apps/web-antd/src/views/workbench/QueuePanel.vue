<script lang="ts" setup>
import { onMounted, onUnmounted } from 'vue';

import { Badge, Button, Empty, List, ListItem, ListItemMeta, message, Spin, Tag } from 'ant-design-vue';

import { useWorkbenchStore } from './store';

const store = useWorkbenchStore();

let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  store.loadQueueList();
  pollTimer = setInterval(() => store.loadQueueList(), 10000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});

const handleAccept = async (chatUserId: string) => {
  try {
    await store.acceptFromQueue(chatUserId);
    message.success('接入成功');
  } catch {
    message.error('接入失败');
  }
};
</script>

<template>
  <div class="queue-panel">
    <div class="queue-header">
      <span>排队等待</span>
      <Badge :count="store.queueList.length" :overflow-count="99" />
    </div>

    <Spin :spinning="store.queueLoading">
      <div v-if="!store.queueList.length && !store.queueLoading" class="queue-empty">
        <Empty description="暂无排队" :image="Empty.PRESENTED_IMAGE_SIMPLE" />
      </div>

      <List v-else size="small" :data-source="store.queueList">
        <template #renderItem="{ item }">
          <ListItem>
            <ListItemMeta>
              <template #title>
                <span>{{ item.nickname }}</span>
                <Tag color="blue" style="margin-left: 6px; font-size: 11px;">
                  #{{ item.queuePosition }}
                </Tag>
              </template>
              <template #description>
                <span style="font-size: 12px;">
                  等待 {{ item.waitMinutes }} 分钟
                </span>
              </template>
              <template #avatar>
                <div class="queue-avatar">
                  <img v-if="item.avatar" :src="item.avatar" class="avatar-img" />
                  <div v-else class="avatar-placeholder">
                    {{ (item.nickname || '?')[0] }}
                  </div>
                </div>
              </template>
            </ListItemMeta>
            <template #actions>
              <Button type="primary" size="small" @click="handleAccept(item.chatUserId)">
                接入
              </Button>
            </template>
          </ListItem>
        </template>
      </List>
    </Spin>
  </div>
</template>

<style scoped>
.queue-panel {
  border-top: 1px solid hsl(var(--border));
  max-height: 240px;
  overflow-y: auto;
}

.queue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border) / 0.5);
  position: sticky;
  top: 0;
  background: hsl(var(--card));
  z-index: 1;
}

.queue-empty {
  padding: 16px;
  text-align: center;
}

.queue-avatar {
  flex-shrink: 0;
}

.avatar-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 500;
}
</style>
