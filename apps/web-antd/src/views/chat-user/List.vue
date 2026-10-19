<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Button, Drawer, Modal, Space, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { getList, postDel, postAddToBlacklist, postRemoveFromBlacklist } from './api';
import DetailDrawer from './DetailDrawer.vue';

const fmtTime = (v: string) => {
  if (!v) return '-';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const onlineLabels: Record<number, { text: string; color: string }> = {
  0: { text: '离线', color: 'default' },
  1: { text: '在线', color: 'success' },
};

const statusLabels: Record<number, { text: string; color: string }> = {
  0: { text: '正常', color: 'success' },
  1: { text: '黑名单', color: 'error' },
};

const userTypeLabels: Record<number, string> = {
  0: '匿名',
  1: '注册',
  2: '外部',
};

interface RowType {}

const formOptions: VbenFormProps = {
  schema: [
    {
      label: '关键词',
      fieldName: 'keyword',
      component: 'Input',
      componentProps: { placeholder: '昵称/ChatUserId/备注' },
    },
    {
      label: '状态',
      fieldName: 'status',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '正常', value: 0 },
          { label: '黑名单', value: 1 },
        ],
      },
    },
    {
      label: '用户类型',
      fieldName: 'userType',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '匿名', value: 0 },
          { label: '注册', value: 1 },
          { label: '外部', value: 2 },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-3',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const gridOptions: VxeGridProps<RowType> = {
  columns: [
    { field: 'id', title: 'Id', width: 60 },
    { field: 'nickname', title: '用户信息', width: 180, slots: { default: 'userInfo' } },
    { field: 'chatUserId', title: 'ChatUserId', width: 180 },
    { field: 'userType', title: '类型', width: 70, slots: { default: 'userType' } },
    { field: 'onlineStatus', title: '在线', width: 70, slots: { default: 'onlineStatus' } },
    { field: 'status', title: '状态', width: 80, slots: { default: 'status' } },
    { field: 'lastActiveTime', title: '最后活跃', width: 150, slots: { default: 'lastActive' } },
    { field: 'ipLocation', title: 'IP归属地', width: 120 },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 200,
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        return await getList({
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

// 详情抽屉
const drawerVisible = ref(false);
const detailUserId = ref(0);

const showDetail = (id: number) => {
  detailUserId.value = id;
  drawerVisible.value = true;
};

const delUser = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该聊天用户吗？',
    onOk: async () => {
      const result: any = await postDel(id);
      if (result.code === 0) gridApi.query();
    },
  });
};

const toggleBlacklist = async (row: any) => {
  if (row.status === 1) {
    const result: any = await postRemoveFromBlacklist(row.id);
    if (result.code === 0) gridApi.query();
  } else {
    Modal.confirm({
      title: '确认拉黑',
      content: '拉黑后该用户将无法发送消息，确定吗？',
      onOk: async () => {
        const result: any = await postAddToBlacklist(row.id);
        if (result.code === 0) gridApi.query();
      },
    });
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #userInfo="{ row }">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img
            v-if="row.avatar"
            :src="row.avatar"
            style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0;"
          />
          <div style="line-height: 1.4; font-size: 12px; min-width: 0;">
            <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 500;">
              {{ row.nicknameRemark || row.nickname || '匿名用户' }}
            </div>
            <div v-if="row.nicknameRemark && row.nickname" style="color: #999;">
              {{ row.nickname }}
            </div>
          </div>
        </div>
      </template>

      <template #userType="{ row }">
        {{ userTypeLabels[row.userType] || '未知' }}
      </template>

      <template #onlineStatus="{ row }">
        <Tag :color="onlineLabels[row.onlineStatus]?.color || 'default'">
          {{ onlineLabels[row.onlineStatus]?.text || '未知' }}
        </Tag>
      </template>

      <template #status="{ row }">
        <Tag :color="statusLabels[row.status]?.color || 'default'">
          {{ statusLabels[row.status]?.text || '未知' }}
        </Tag>
      </template>

      <template #lastActive="{ row }">
        {{ fmtTime(row.lastActiveTime) }}
      </template>

      <template #action="{ row }">
        <Space>
          <Button type="primary" size="small" @click="showDetail(row.id)">
            详情
          </Button>
          <Button size="small" @click="toggleBlacklist(row)">
            {{ row.status === 1 ? '解除拉黑' : '拉黑' }}
          </Button>
          <Button type="primary" danger size="small" @click="delUser(row.id)">
            删除
          </Button>
        </Space>
      </template>
    </Grid>

    <Drawer
      v-model:open="drawerVisible"
      title="用户详情"
      width="500"
      placement="right"
    >
      <DetailDrawer
        v-if="drawerVisible"
        :user-id="detailUserId"
        @updated="gridApi.query()"
      />
    </Drawer>
  </Page>
</template>
