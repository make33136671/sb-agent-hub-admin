<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Badge, Button, message, Modal, Select as ASelect, Space, Tag, Tooltip, Typography } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { h, ref } from 'vue';

import {
  getAccessCode,
  getAdminOptions,
  getList,
  postDel,
  postResetPlatformKey,
  postToggleEnabled,
  postToggleTakeover,
} from './api';

const router = useRouter();

const { Text } = Typography;

const fmtTime = (v: string) => {
  if (!v) return '-';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const platformTypeLabels: Record<number, string> = {
  0: 'Web',
  1: 'App',
  2: 'WeChat',
  3: 'API',
};

const accessTypeLabels: Record<number, string> = {
  0: 'JS 嵌入',
  1: 'Vue 组件',
  2: '独立聊天页',
};

const accessTypeColors: Record<number, string> = {
  0: 'blue',
  1: 'green',
  2: 'purple',
};

interface RowType {
  id: number;
  platformName: string;
  ownerName: string;
  platformType: number;
  accessType: number;
  platformKey: string;
  domain: string;
  isEnabled: boolean;
  isAdminTakeover: boolean;
  takeoverAdminName?: string;
  createTime: string;
}

const formOptions: VbenFormProps = {
  schema: [
    {
      label: '关键词',
      fieldName: 'keyword',
      component: 'Input',
      componentProps: { placeholder: '平台名称/Key' },
    },
    {
      label: '类型',
      fieldName: 'platformType',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: 'Web', value: 0 },
          { label: 'App', value: 1 },
          { label: 'WeChat', value: 2 },
          { label: 'API', value: 3 },
        ],
      },
    },
    {
      label: '状态',
      fieldName: 'isEnabled',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '启用', value: true },
          { label: '禁用', value: false },
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
    { field: 'platformName', title: '平台名称', width: 150 },
    { field: 'ownerName', title: '站长', width: 100 },
    { field: 'platformType', title: '类型', width: 80, slots: { default: 'platformType' } },
    { field: 'accessType', title: '接入方式', width: 110, slots: { default: 'accessType' } },
    { field: 'platformKey', title: '平台Key', width: 280, slots: { default: 'platformKey' } },
    { field: 'domain', title: '域名', minWidth: 150, slots: { default: 'domainCol' } },
    { field: 'isEnabled', title: '状态', width: 80, slots: { default: 'enabledStatus' } },
    { field: 'isAdminTakeover', title: '接管', width: 120, slots: { default: 'takeoverStatus' } },
    { field: 'createTime', title: '创建时间', width: 160, slots: { default: 'createTime' } },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 420,
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

const handleAdd = () => {
  router.push({ name: 'PlatformForm' });
};

const delPlatform = (id: number) => {
  Modal.confirm({
    title: '确认删除',
    content: '删除后将无法恢复，确定要删除该平台吗？',
    onOk: async () => {
      const result: any = await postDel(id);
      if (result.code === 0) gridApi.query();
    },
  });
};

const toggleEnabled = async (id: number) => {
  const result: any = await postToggleEnabled(id);
  if (result.code === 0) gridApi.query();
};

const resetKey = (id: number) => {
  Modal.confirm({
    title: '确认重置',
    content: '重置后旧的 PlatformKey 将立即失效，已接入的 Widget 需要更换秘钥。确定要重置吗？',
    onOk: async () => {
      const result: any = await postResetPlatformKey(id);
      if (result.code === 0) {
        message.success('秘钥已重置');
        gridApi.query();
      }
    },
  });
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text).then(() => {
    message.success('已复制到剪贴板');
  });
};

const showAccessCode = async (row: any) => {
  const res: any = await getAccessCode(row.id);
  if (!res) return;

  const isChat = res.accessType === 2;
  const title = `${res.accessTypeName} — ${res.platformName}`;

  Modal.info({
    title,
    width: 700,
    content: () =>
      h('div', [
        h('p', { style: 'margin-bottom: 8px; color: #666;' },
          isChat ? '将以下链接分享给用户，打开即可聊天：' : '将以下代码粘贴到您的网站中：'),
        h('pre', {
          style: 'background: #f5f5f5; padding: 16px; border-radius: 6px; overflow-x: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-break: break-all;',
        }, res.code),
        h(Button, {
          type: 'primary',
          style: 'margin-top: 12px;',
          onClick: () => copyToClipboard(res.code),
        }, () => '复制代码'),
        isChat
          ? h(Button, {
              style: 'margin-top: 12px; margin-left: 8px;',
              onClick: () => window.open(res.code, '_blank'),
            }, () => '在新窗口打开')
          : null,
      ]),
    okText: '关闭',
  });
};

// 接管相关
const selectedAdminId = ref<number | undefined>();
const adminOptionsList = ref<any[]>([]);
let adminOptionsLoaded = false;

const loadAdminOptions = async () => {
  if (adminOptionsLoaded) return;
  const res: any = await getAdminOptions();
  adminOptionsList.value = res.map((a: any) => ({
    label: a.name || a.username,
    value: a.id,
  }));
  adminOptionsLoaded = true;
};

const handleTakeover = async (row: any) => {
  if (row.isAdminTakeover) {
    // 取消接管
    Modal.confirm({
      title: '取消接管',
      content: '确定要取消管理员接管吗？取消后将恢复正常分配。',
      onOk: async () => {
        const result: any = await postToggleTakeover(row.id);
        if (result.code === 0) {
          message.success('已取消接管');
          gridApi.query();
        }
      },
    });
  } else {
    // 开启接管：弹窗选择管理员
    await loadAdminOptions();
    selectedAdminId.value = undefined;

    Modal.confirm({
      title: '开启管理员接管',
      content: () =>
        h('div', [
          h('p', { style: 'margin-bottom: 8px' }, '选择接管管理员：'),
          h(ASelect, {
            placeholder: '请选择管理员',
            options: adminOptionsList.value,
            value: selectedAdminId.value,
            'onUpdate:value': (val: number) => {
              selectedAdminId.value = val;
            },
            style: 'width: 100%',
          }),
        ]),
      onOk: async () => {
        if (!selectedAdminId.value) {
          message.warning('请选择接管管理员');
          return Promise.reject();
        }
        const result: any = await postToggleTakeover(row.id, selectedAdminId.value);
        if (result.code === 0) {
          message.success('已开启接管');
          gridApi.query();
        }
      },
    });
  }
};
</script>

<template>
  <Page auto-content-height>
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" @click="handleAdd">
          新增平台
        </Button>
      </template>

      <template #platformType="{ row }">
        {{ platformTypeLabels[row.platformType] || '未知' }}
      </template>

      <template #accessType="{ row }">
        <Tag :color="accessTypeColors[row.accessType] || 'default'">
          {{ accessTypeLabels[row.accessType] || '未知' }}
        </Tag>
      </template>

      <template #platformKey="{ row }">
        <div style="display: flex; align-items: center; gap: 4px;">
          <Text code style="font-size: 12px;">{{ row.platformKey }}</Text>
          <Button type="link" size="small" @click="copyToClipboard(row.platformKey)">
            复制
          </Button>
        </div>
      </template>

      <template #domainCol="{ row }">
        <div style="display: flex; align-items: center; gap: 4px;">
          <span>{{ row.domain || '-' }}</span>
          <Tooltip v-if="row.pendingDomainCount > 0" :title="`${row.pendingDomainCount} 个待审核域名`">
            <Badge :count="row.pendingDomainCount" :overflow-count="99" style="margin-left: 4px;" />
          </Tooltip>
        </div>
      </template>

      <template #enabledStatus="{ row }">
        <Tag :color="row.isEnabled ? 'success' : 'default'">
          {{ row.isEnabled ? '启用' : '禁用' }}
        </Tag>
      </template>

      <template #takeoverStatus="{ row }">
        <Tag v-if="row.isAdminTakeover" color="warning">
          已接管{{ row.takeoverAdminName ? `(${row.takeoverAdminName})` : '' }}
        </Tag>
        <Tag v-else color="default">正常</Tag>
      </template>

      <template #createTime="{ row }">
        {{ fmtTime(row.createTime) }}
      </template>

      <template #action="{ row }">
        <Space>
          <Button
            type="primary"
            size="small"
            @click="router.push({ name: 'PlatformForm', query: { id: row.id } })"
          >
            编辑
          </Button>
          <Button size="small" @click="toggleEnabled(row.id)">
            {{ row.isEnabled ? '禁用' : '启用' }}
          </Button>
          <Button size="small" type="dashed" @click="showAccessCode(row)">
            接入代码
          </Button>
          <Button size="small" @click="resetKey(row.id)">
            重置秘钥
          </Button>
          <Button
            size="small"
            :type="row.isAdminTakeover ? 'default' : 'primary'"
            :ghost="!row.isAdminTakeover"
            @click="handleTakeover(row)"
          >
            {{ row.isAdminTakeover ? '取消接管' : '接管' }}
          </Button>
          <Button type="primary" danger size="small" @click="delPlatform(row.id)">
            删除
          </Button>
        </Space>
      </template>
    </Grid>
  </Page>
</template>
