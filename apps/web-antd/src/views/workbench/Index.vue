<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue';

import VisitorList from './VisitorList.vue';
import QueuePanel from './QueuePanel.vue';
import ChatPanel from './ChatPanel.vue';
import UserDetail from './UserDetail.vue';
import StatusSwitch from './StatusSwitch.vue';

import { useWorkbenchStore } from './store';

const store = useWorkbenchStore();

const showDetail = ref(false);

let pollTimer: ReturnType<typeof setInterval> | null = null;

onMounted(async () => {
  // 加载访客列表和当前状态（IM 连接已由 Layout 层处理）
  await Promise.all([
    store.loadVisitors(),
    store.loadMyStatus(),
    store.loadQueueList(),
  ]);

  // 定时刷新访客列表（30秒）
  pollTimer = setInterval(() => {
    store.loadVisitors(store.searchKeyword);
  }, 30000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
});
</script>

<template>
  <div class="workbench-container">
    <!-- 左侧：访客列表 + 排队 -->
    <div class="workbench-sidebar">
      <StatusSwitch />
      <VisitorList />
      <QueuePanel />
    </div>

    <!-- 中间：聊天面板 -->
    <div class="workbench-main">
      <ChatPanel />
    </div>

    <!-- 切换按钮 -->
    <button
      class="detail-toggle"
      :class="{ active: showDetail }"
      title="访客详情"
      @click="showDetail = !showDetail"
    >
      <svg
        v-if="!showDetail"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M22 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16" />
        <path d="M2 12h2" />
        <path d="M2 6h2" />
        <path d="M2 18h2" />
        <path d="M6 12h16" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    </button>

    <!-- 右侧：用户详情 -->
    <div v-show="showDetail" class="workbench-detail">
      <UserDetail />
    </div>
  </div>
</template>

<style scoped>
.workbench-container {
  display: flex;
  height: var(--vben-content-height, calc(100vh - 88px));
  overflow: hidden;
  position: relative;
}

.workbench-sidebar {
  width: 280px;
  min-width: 280px;
  border-right: 1px solid hsl(var(--border));
  display: flex;
  flex-direction: column;
  background: hsl(var(--card));
}

.workbench-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: hsl(var(--card));
  min-width: 0;
}

.detail-toggle {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 20px;
  height: 48px;
  border: 1px solid hsl(var(--border));
  border-right: none;
  border-radius: 6px 0 0 6px;
  background: hsl(var(--card));
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.detail-toggle:hover {
  background: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.detail-toggle.active {
  right: 300px;
}

.workbench-detail {
  width: 300px;
  min-width: 300px;
  border-left: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  overflow-y: auto;
}
</style>
