<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Badge, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { requestClient } from '#/api/request';

import { getConversationList } from './api';

const fmtTime = (v: string | number | null) => {
  if (!v) return '-';
  // 支持毫秒时间戳和日期字符串
  const d = typeof v === 'number' ? new Date(v) : new Date(v);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const onlineLabels: Record<number, { text: string; color: string }> = {
  0: { text: '离线', color: 'default' },
  1: { text: '在线', color: 'success' },
  2: { text: '忙碌', color: 'warning' },
};

// 客服下拉选项
const agentOptions = ref<{ label: string; value: number }[]>([]);

async function loadAgentOptions() {
  try {
    const data: any = await requestClient.get('/Member/AgentsByOwner');
    if (Array.isArray(data)) {
      agentOptions.value = data.map((m: any) => ({
        label: m.name || m.username,
        value: m.id,
      }));
    }
  } catch {
    // 忽略加载失败
  }
}

onMounted(() => {
  loadAgentOptions();
});

const truncate = (str: string, len: number = 50) => {
  if (!str) return '-';
  return str.length > len ? str.slice(0, len) + '...' : str;
};

interface RowType {}

const formOptions: VbenFormProps = {
  schema: [
    {
      label: '关键词',
      fieldName: 'keyword',
      component: 'Input',
      componentProps: { placeholder: '访客昵称' },
    },
    {
      label: '客服',
      fieldName: 'agentId',
      component: 'Select',
      componentProps: {
        placeholder: '全部客服',
        allowClear: true,
        options: agentOptions,
      },
    },
  ],
  wrapperClass: 'grid-cols-2',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'visitorNickname', title: '访客信息', width: 180, slots: { default: 'visitorInfo' } },
    { field: 'agentName', title: '客服', width: 120 },
    { field: 'lastMsgContent', title: '最新消息', minWidth: 200, slots: { default: 'lastMsg' } },
    { field: 'lastMsgTime', title: '最新消息时间', width: 160, slots: { default: 'lastMsgTime' } },
    { field: 'unreadCount', title: '未读消息', width: 100, slots: { default: 'unread' } },
    { field: 'visitorOnlineStatus', title: '访客状态', width: 90, slots: { default: 'onlineStatus' } },
    { field: 'firstVisitTime', title: '首次访问', width: 150, slots: { default: 'firstVisit' } },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getConversationList({
          page: page.currentPage,
          pageSize: page.pageSize,
          ...formValues,
        });
      },
    },
  },
  showOverflow: false,
  rowConfig: { isHover: true },
  toolbarConfig: { refresh: true, custom: true },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #visitorInfo="{ row }">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img
            v-if="row.visitorAvatar"
            :src="row.visitorAvatar"
            style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
          />
          <div
            v-else
            style="width: 32px; height: 32px; border-radius: 50%; background: #e8e8e8; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #999; font-size: 12px;"
          >
            {{ (row.visitorNickname || '?').charAt(0) }}
          </div>
          <div style="line-height: 1.4; font-size: 12px; min-width: 0;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">
              {{ row.visitorNickname || '匿名用户' }}
            </div>
          </div>
        </div>
      </template>

      <template #lastMsg="{ row }">
        <span style="color: #666;">{{ truncate(row.lastMsgContent) }}</span>
      </template>

      <template #lastMsgTime="{ row }">
        {{ fmtTime(row.lastMsgTime) }}
      </template>

      <template #unread="{ row }">
        <Badge
          v-if="row.unreadCount > 0"
          :count="row.unreadCount"
          :overflow-count="99"
        />
        <span v-else style="color: #ccc;">0</span>
      </template>

      <template #onlineStatus="{ row }">
        <Tag :color="onlineLabels[row.visitorOnlineStatus]?.color || 'default'">
          {{ onlineLabels[row.visitorOnlineStatus]?.text || '未知' }}
        </Tag>
      </template>

      <template #firstVisit="{ row }">
        {{ fmtTime(row.firstVisitTime) }}
      </template>
    </Grid>
  </Page>
</template>
