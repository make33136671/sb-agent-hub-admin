<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useUserStore } from '@vben/stores';
import { Badge, Button, Card, List, message, Space, Tag, Tooltip, Typography } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

import {
  getAdminOptions,
  getDetail,
  getOwnerOptions,
  getPendingDomains,
  postAdd,
  postApproveDomain,
  postEdit,
  postRejectDomain,
} from './api';

const route = useRoute();
const userStore = useUserStore();
const isMember = computed(() => userStore.userInfo?.userType === 'Member');

const id = ref<number>(0);
const ownerOptions = ref<any[]>([]);
const adminOptions = ref<any[]>([]);
const pendingDomains = ref<any[]>([]);
const pendingLoading = ref(false);

const fmtTime = (v: string) => {
  if (!v) return '-';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 域名标准化：去协议、去路径、去默认端口、小写 */
function normalizeDomain(domain: string): string {
  let d = domain.trim().toLowerCase();
  if (d.startsWith('http://')) d = d.slice(7);
  else if (d.startsWith('https://')) d = d.slice(8);
  const slashIdx = d.indexOf('/');
  if (slashIdx >= 0) d = d.slice(0, slashIdx);
  if (d.endsWith(':80')) d = d.slice(0, -3);
  else if (d.endsWith(':443')) d = d.slice(0, -4);
  return d.trim();
}

/** 格式化域名白名单文本：标准化 + 去重 + 排序 */
function formatDomainsText(text: string): string {
  const lines = text.split('\n').map((l) => normalizeDomain(l)).filter(Boolean);
  const unique = [...new Set(lines)].sort();
  return unique.join('\n');
}

/** 加载待审核域名 */
async function loadPendingDomains() {
  if (id.value <= 0) return;
  pendingLoading.value = true;
  try {
    const res = await getPendingDomains(id.value);
    pendingDomains.value = res as any[] || [];
  } catch {
    pendingDomains.value = [];
  } finally {
    pendingLoading.value = false;
  }
}

/** 批准域名 */
async function handleApprove(item: any) {
  const result: any = await postApproveDomain(item.id);
  if (result.code === 0) {
    message.success(`域名 ${item.domain} 已加入白名单`);
    // 刷新待审核列表 & 重新加载表单数据（白名单已更新）
    await Promise.all([loadPendingDomains(), reloadFormData()]);
  }
}

/** 拒绝域名 */
async function handleReject(item: any) {
  const result: any = await postRejectDomain(item.id);
  if (result.code === 0) {
    message.success(`域名 ${item.domain} 已拒绝`);
    await loadPendingDomains();
  }
}

/** 重新加载表单数据 */
async function reloadFormData() {
  if (id.value <= 0) return;
  const result: any = await getDetail(id.value);
  if (result.allowedDomains) {
    try {
      const domains = JSON.parse(result.allowedDomains);
      if (Array.isArray(domains)) {
        result.allowedDomains = domains.join('\n');
      }
    } catch { /* ignore */ }
  }
  baseFormApi.setValues(result);
}

/** 格式化当前域名白名单输入 */
async function handleFormatDomains() {
  const values = await baseFormApi.getValues();
  const raw = values.allowedDomains;
  if (!raw || typeof raw !== 'string') return;
  const formatted = formatDomainsText(raw);
  baseFormApi.setValues({ allowedDomains: formatted });
  message.success('域名已格式化');
}

onMounted(async () => {
  // 加载站长和管理员选项
  const [ownerRes, adminRes] = await Promise.all([
    getOwnerOptions(),
    getAdminOptions(),
  ]);
  ownerOptions.value = (ownerRes as any).map((o: any) => ({
    label: o.name || o.username,
    value: o.id,
  }));
  adminOptions.value = (adminRes as any).map((a: any) => ({
    label: a.name || a.username,
    value: a.id,
  }));

  // 更新表单选项
  baseFormApi.updateSchema([
    {
      fieldName: 'ownerId',
      componentProps: { options: ownerOptions.value },
    },
    {
      fieldName: 'takeoverAdminId',
      componentProps: { options: adminOptions.value },
    },
  ]);

  id.value = Number(route.query.id) || 0;
  if (id.value > 0) {
    const result: any = await getDetail(id.value);
    // 将 AllowedDomains JSON 数组转为多行文本展示
    if (result.allowedDomains) {
      try {
        const domains = JSON.parse(result.allowedDomains);
        if (Array.isArray(domains)) {
          result.allowedDomains = domains.join('\n');
        }
      } catch { /* ignore */ }
    }
    baseFormApi.setValues(result);

    // 加载待审核域名
    await loadPendingDomains();
  }
});

const [BaseForm, baseFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: { class: 'w-full' },
  },
  handleSubmit: onSubmit,
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'platformName',
      component: 'Input',
      label: '平台名称',
      rules: 'required',
      componentProps: { placeholder: '请输入平台名称' },
    },
    {
      fieldName: 'ownerId',
      component: 'Select',
      label: '站长',
      componentProps: {
        placeholder: '选择站长（可留空）',
        allowClear: true,
        options: [],
        disabled: isMember.value,
      },
      help: isMember.value ? '站长身份由系统自动锁定' : undefined,
    },
    {
      fieldName: 'platformType',
      component: 'RadioGroup',
      label: '平台类型',
      defaultValue: 0,
      rules: 'required',
      componentProps: {
        options: [
          { label: 'Web', value: 0, key: '0' },
          { label: 'App', value: 1, key: '1' },
          { label: 'WeChat', value: 2, key: '2' },
          { label: 'API', value: 3, key: '3' },
        ],
      },
    },
    {
      fieldName: 'accessType',
      component: 'RadioGroup',
      label: '接入方式',
      defaultValue: 0,
      rules: 'required',
      componentProps: {
        options: [
          { label: 'JS 嵌入', value: 0, key: '0' },
          { label: 'Vue 组件', value: 1, key: '1' },
          { label: '独立聊天页', value: 2, key: '2' },
        ],
      },
      help: '每个平台只能选择一种接入方式',
    },
    {
      fieldName: 'domain',
      component: 'Input',
      label: '域名',
      componentProps: { placeholder: '允许接入的域名，如 example.com' },
    },
    {
      fieldName: 'allowedDomains',
      component: 'Textarea',
      label: '域名白名单',
      componentProps: {
        placeholder: '每行一个域名，如：\nwww.example.com\napp.example.com',
        rows: 4,
      },
      help: 'JS 和 Vue 接入方式会校验域名白名单，Chat 方式免校验。保存时会自动格式化（去协议、小写、去重、排序）',
    },
    {
      fieldName: 'welcomeMessage',
      component: 'Textarea',
      label: '欢迎语',
      componentProps: {
        placeholder: '访客接入时自动发送的欢迎消息',
        rows: 3,
      },
    },
    {
      fieldName: 'isAdminTakeover',
      component: 'Switch',
      label: '管理员接管',
      defaultValue: false,
    },
    {
      fieldName: 'takeoverAdminId',
      component: 'Select',
      label: '接管管理员',
      componentProps: {
        placeholder: '选择接管管理员',
        allowClear: true,
        options: [],
      },
      dependencies: {
        triggerFields: ['isAdminTakeover'],
        show: (values: Record<string, any>) => values.isAdminTakeover === true,
      },
    },
  ],
  wrapperClass: 'grid-cols-1',
});

function onSubmit(values: Record<string, any>) {
  // 将多行文本域名转换为 JSON 数组
  if (values.allowedDomains && typeof values.allowedDomains === 'string') {
    const domains = values.allowedDomains
      .split('\n')
      .map((d: string) => d.trim())
      .filter((d: string) => d.length > 0);
    values.allowedDomains = JSON.stringify(domains);
  }

  if (id.value > 0) {
    values.id = id.value;
    postEdit(values).then((result: any) => {
      if (result.code === 0) {
        message.success('保存成功');
      }
    });
  } else {
    postAdd(values).then((result: any) => {
      if (result.code === 0) {
        id.value = result.data?.id;
        message.success('平台创建成功');
      }
    });
  }
}
</script>

<template>
  <div style="margin: 10px; max-width: 700px;">
    <Card :title="id > 0 ? '编辑平台' : '新增平台'">
      <BaseForm />
      <div style="margin-top: -8px; margin-bottom: 16px; padding-left: 120px;">
        <Button size="small" @click="handleFormatDomains">
          格式化域名
        </Button>
        <Typography.Text type="secondary" style="margin-left: 8px; font-size: 12px;">
          自动去除协议前缀、小写化、去重、排序
        </Typography.Text>
      </div>
    </Card>

    <Card
      v-if="id > 0"
      style="margin-top: 12px;"
      :loading="pendingLoading"
    >
      <template #title>
        <Space>
          <span>待审核域名</span>
          <Badge :count="pendingDomains.length" :overflow-count="99" />
        </Space>
      </template>
      <template #extra>
        <Button
          v-if="pendingDomains.length > 0"
          type="link"
          size="small"
          @click="loadPendingDomains"
        >
          刷新
        </Button>
      </template>

      <div v-if="pendingDomains.length === 0" style="color: #999; text-align: center; padding: 12px 0;">
        暂无待审核域名
      </div>
      <List v-else :data-source="pendingDomains" size="small">
        <template #renderItem="{ item }">
          <List.Item>
            <template #actions>
              <Button type="primary" size="small" @click="handleApprove(item)">
                加入白名单
              </Button>
              <Button size="small" danger @click="handleReject(item)">
                拒绝
              </Button>
            </template>
            <List.Item.Meta>
              <template #title>
                <Space>
                  <Typography.Text code>{{ item.domain }}</Typography.Text>
                  <Tag color="orange">{{ item.requestCount }} 次请求</Tag>
                </Space>
              </template>
              <template #description>
                <Space :size="16">
                  <Tooltip :title="`首次: ${fmtTime(item.firstSeenTime)}`">
                    <span style="font-size: 12px; color: #999;">
                      最近请求: {{ fmtTime(item.lastSeenTime) }}
                    </span>
                  </Tooltip>
                  <span v-if="item.lastIpAddress" style="font-size: 12px; color: #999;">
                    IP: {{ item.lastIpAddress }}
                  </span>
                </Space>
              </template>
            </List.Item.Meta>
          </List.Item>
        </template>
      </List>
    </Card>
  </div>
</template>
