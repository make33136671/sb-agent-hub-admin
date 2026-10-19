<script lang="ts" setup>
import { computed } from 'vue';

import { Badge, Checkbox, Dropdown, Menu, MenuDivider, MenuItem, Tooltip } from 'ant-design-vue';

import { useWorkbenchStore } from './store';

const store = useWorkbenchStore();

const statusOptions = [
  { key: 1, label: '在线', color: '#52c41a' },
  { key: 2, label: '忙碌', color: '#faad14' },
  { key: 3, label: '离开', color: '#d9d9d9' },
  { key: 0, label: '离线', color: '#ff4d4f' },
];

const isProcessing = computed(
  () => store.statusSwitching || store.imConnecting,
);

/** 切换中的文案：根据方向区分 */
const processingText = computed(() => {
  if (store.userDesiredStatus === 0) return '断开中...';
  if (store.imConnecting) return '连接中...';
  return '切换中...';
});

const currentStatus = computed(() => {
  return (
    statusOptions.find((s) => s.key === store.agentStatus.onlineStatus) ??
    statusOptions[3]!
  );
});

/** 用户期望在线但 IM 断开（非连接中） */
const showIMWarning = computed(() => {
  return (
    store.userDesiredStatus >= 1 &&
    !store.imConnected &&
    !store.imConnecting &&
    !store.statusSwitching
  );
});

/** 判断访客是否在线（兼容字符串枚举 "Online" 和数字 1） */
function isVisitorOnline(status: any): boolean {
  return status === 1 || status === 'Online' || status === true;
}

/** 访客在线/离线统计 */
const onlineVisitorCount = computed(() =>
  store.visitors.filter((v: any) => isVisitorOnline(v.onlineStatus)).length,
);
const offlineVisitorCount = computed(() =>
  store.visitors.filter((v: any) => !isVisitorOnline(v.onlineStatus)).length,
);

/** 当前是否离线（离线时才显示清除缓存选项） */
const isOffline = computed(() => store.agentStatus.onlineStatus === 0);

const handleStatusChange = async (info: any) => {
  const status = Number(info.key);
  await store.updateStatus(status);
};
</script>

<template>
  <div class="status-switch">
    <Dropdown :trigger="['click']" :disabled="isProcessing">
      <div class="status-trigger">
        <!-- 状态切换中 -->
        <span v-if="isProcessing" class="status-switching">
          <span class="status-dot status-dot-switching" />
          <span class="status-text-switching">{{ processingText }}</span>
        </span>
        <!-- 正常状态 -->
        <template v-else>
          <Badge :color="currentStatus.color" :text="currentStatus.label" />
          <Tooltip v-if="showIMWarning" title="IM 连接断开">
            <span class="im-warning">!</span>
          </Tooltip>
        </template>
        <span class="status-count">
          <span class="count-online">接待{{ onlineVisitorCount }}人</span>
          <span class="count-sep">/</span>
          <span class="count-offline">离线{{ offlineVisitorCount }}人</span>
        </span>
      </div>
      <template #overlay>
        <Menu @click="handleStatusChange">
          <MenuItem v-for="opt in statusOptions" :key="opt.key">
            <Badge :color="opt.color" :text="opt.label" />
          </MenuItem>
          <template v-if="isOffline">
            <MenuDivider />
            <div class="clear-cache-option" @click.stop>
              <Checkbox v-model:checked="store.clearCacheOnLogin">
                清除缓存登录
              </Checkbox>
            </div>
          </template>
        </Menu>
      </template>
    </Dropdown>
  </div>
</template>

<style scoped>
.status-switch {
  padding: 12px 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.status-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: background 0.2s;
}

.status-trigger:hover {
  background: hsl(var(--accent));
}

.status-count {
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.count-online {
  color: #52c41a;
}

.count-sep {
  color: hsl(var(--muted-foreground));
  margin: 0 1px;
}

.count-offline {
  color: hsl(var(--muted-foreground));
}

.clear-cache-option {
  padding: 5px 12px;
  font-size: 13px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

.status-switching {
  display: inline-flex;
  align-items: center;
}

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
}

.status-dot-switching {
  background: #1677ff;
  animation: pulse 1.2s ease-in-out infinite;
}

.status-text-switching {
  animation: pulse 1.2s ease-in-out infinite;
  color: #1677ff;
  font-size: 13px;
}

.im-warning {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fa8c16;
  color: #fff;
  font-size: 10px;
  font-weight: bold;
  margin-left: 6px;
  cursor: help;
}
</style>
