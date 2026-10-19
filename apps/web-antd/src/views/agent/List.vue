<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Input, message, Modal, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { getMyAgents, postDel, postResetPassword, postToggleStatus } from './api';

const router = useRouter();

const fmtTime = (v: string) => {
  if (!v) return '-';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const onlineLabels: Record<string, { text: string; color: string }> = {
  Offline: { text: '离线', color: 'default' },
  Online: { text: '在线', color: 'success' },
  Busy: { text: '忙碌', color: 'warning' },
};

interface RowType {}

const formOptions: VbenFormProps = {
  schema: [
    {
      label: '关键词',
      fieldName: 'keyword',
      component: 'Input',
      componentProps: { placeholder: '用户名/名称' },
    },
    {
      label: '状态',
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '正常', value: 'Active' },
          { label: '封禁', value: 'Banned' },
        ],
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
    { field: 'agentNo', title: '工号', width: 90 },
    { field: 'username', title: '客服信息', width: 180, slots: { default: 'userInfo' } },
    { field: 'onlineStatus', title: '在线状态', width: 90, slots: { default: 'onlineStatus' } },
    { field: 'concurrent', title: '接待量', width: 120, slots: { default: 'concurrent' } },
    { field: 'status', title: '状态', width: 80, slots: { default: 'status' } },
    { field: 'createdTime', title: '创建/最后在线', minWidth: 170, slots: { default: 'timeInfo' } },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 250,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getMyAgents({
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

const [Grid, gridApi] = useVbenVxeGrid({ formOptions, gridOptions });

const delAgent = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该客服吗？',
    onOk: async () => {
      const result: any = await postDel(id);
      if (result.code === 0) gridApi.query();
    },
  });
};

const toggleStatus = async (id: number) => {
  const result: any = await postToggleStatus(id);
  if (result.code === 0) gridApi.query();
};

// 重置密码
const resetPwdVisible = ref(false);
const resetPwdId = ref(0);
const resetPwdName = ref('');
const resetPwdValue = ref('');

const showResetPassword = (row: any) => {
  resetPwdId.value = row.id;
  resetPwdName.value = row.username || row.name || `#${row.id}`;
  resetPwdValue.value = '';
  resetPwdVisible.value = true;
};

const handleResetPassword = async () => {
  if (!resetPwdValue.value) {
    message.warning('请输入新密码');
    return;
  }
  const result: any = await postResetPassword(resetPwdId.value, resetPwdValue.value);
  if (result.code === 0) {
    message.success('密码重置成功');
    resetPwdVisible.value = false;
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button
          type="primary"
          @click="router.push({ name: 'AgentForm' })"
        >
          新增客服
        </Button>
      </template>

      <template #userInfo="{ row }">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img
            v-if="row.avatar"
            :src="row.avatar"
            style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
          />
          <div style="line-height: 1.4; font-size: 12px; min-width: 0;">
            <div style="font-weight: 500;">{{ row.username }}</div>
            <div style="color: #999;">{{ row.name }}</div>
          </div>
        </div>
      </template>

      <template #onlineStatus="{ row }">
        <Tag :color="onlineLabels[row.onlineStatus]?.color || 'default'">
          {{ onlineLabels[row.onlineStatus]?.text || '未知' }}
        </Tag>
      </template>

      <template #concurrent="{ row }">
        {{ row.currentCount ?? 0 }} / {{ row.maxConcurrent ?? 0 }}
      </template>

      <template #status="{ row }">
        <Tag :color="row.status === 'Active' ? 'success' : 'error'">
          {{ row.status === 'Active' ? '正常' : '封禁' }}
        </Tag>
      </template>

      <template #timeInfo="{ row }">
        <div style="line-height: 1.4; font-size: 12px;">
          <div>创建: {{ fmtTime(row.createdTime) }}</div>
          <div style="color: #999;">在线: {{ fmtTime(row.lastOnlineTime) }}</div>
        </div>
      </template>

      <template #action="{ row }">
        <Space>
          <Button
            type="primary"
            size="small"
            @click="router.push({ name: 'AgentForm', query: { id: row.id } })"
          >
            编辑
          </Button>
          <Button size="small" @click="showResetPassword(row)">
            重置密码
          </Button>
          <Button size="small" @click="toggleStatus(row.id)">
            {{ row.status === 'Active' ? '封禁' : '启用' }}
          </Button>
          <Button type="primary" danger size="small" @click="delAgent(row.id)">
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Modal
      v-model:open="resetPwdVisible"
      :title="`重置密码 - ${resetPwdName}`"
      @ok="handleResetPassword"
      ok-text="确定"
    >
      <div style="padding: 16px 0">
        <Input
          v-model:value="resetPwdValue"
          placeholder="请输入新密码"
          type="password"
          allow-clear
        />
      </div>
    </Modal>
  </Page>
</template>
