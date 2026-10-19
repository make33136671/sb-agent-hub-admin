<script lang="ts" setup>
import type { VxeGridProps } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { Card, Statistic, Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { getList, getStats } from './api';

const stats = ref<any>(null);

onMounted(async () => {
  const res: any = await getStats({ days: 7 });
  stats.value = res;
});

const fmtTime = (v: string) => {
  if (!v) return '-';
  const d = new Date(v);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const reasonColors: Record<string, string> = {
  type_mismatch: 'error',
  domain_mismatch: 'warning',
  platform_disabled: 'default',
  quota_exceeded: 'processing',
};

interface RowType {
  id: number;
  createTime: string;
  platformName: string;
  requestDomain: string;
  requestSource: string;
  expectedSource: string;
  reason: string;
  reasonText: string;
  ipAddress: string;
  requestUrl: string;
}

const formOptions: any = {
  schema: [
    {
      label: '拒绝原因',
      fieldName: 'reason',
      component: 'Select',
      componentProps: {
        placeholder: '全部',
        allowClear: true,
        options: [
          { label: '接入类型不匹配', value: 'type_mismatch' },
          { label: '域名不匹配', value: 'domain_mismatch' },
          { label: '平台已停用', value: 'platform_disabled' },
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
    { field: 'createTime', title: '时间', width: 170, slots: { default: 'time' } },
    { field: 'platformName', title: '平台', width: 120 },
    { field: 'requestDomain', title: '来源域名', width: 160 },
    { field: 'requestSource', title: '来源类型', width: 90 },
    { field: 'expectedSource', title: '期望类型', width: 90 },
    { field: 'reason', title: '拒绝原因', width: 140, slots: { default: 'reason' } },
    { field: 'ipAddress', title: 'IP', width: 130 },
    { field: 'requestUrl', title: '请求URL', minWidth: 200 },
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
  showOverflow: true,
  rowConfig: { isHover: true },
  toolbarConfig: { refresh: true },
};

const [Grid] = useVbenVxeGrid({ formOptions, gridOptions });
</script>

<template>
  <Page>
    <div v-if="stats" style="display: flex; gap: 16px; margin: 10px 10px 0;">
      <Card size="small" style="flex: 1;">
        <Statistic title="近7天违规总数" :value="stats.total" />
      </Card>
      <Card v-for="item in (stats.details || [])" :key="item.reason" size="small" style="flex: 1;">
        <Statistic :title="item.reasonText" :value="item.count" />
      </Card>
    </div>

    <div style="margin: 10px; height: calc(100vh - 250px); min-height: 300px;">
      <Grid>
        <template #time="{ row }">
          {{ fmtTime(row.createTime) }}
        </template>

        <template #reason="{ row }">
          <Tag :color="reasonColors[row.reason] || 'default'">
            {{ row.reasonText || row.reason }}
          </Tag>
        </template>
      </Grid>
    </div>
  </Page>
</template>
