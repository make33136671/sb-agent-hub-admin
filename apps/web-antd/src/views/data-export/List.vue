<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Button, Card, Col, DatePicker, message, Row, Space, Tag } from 'ant-design-vue';

import { requestClient } from '#/api/request';

const canExport = ref(false);
const loading = ref(false);
const dateRange = ref<[any, any]>();

onMounted(async () => {
  try {
    const res: any = await requestClient.get('/DataExport/CheckPermission');
    canExport.value = res?.canExport || false;
  } catch {
    canExport.value = false;
  }
});

const getBaseURL = () => {
  const url = (requestClient as any).defaults?.baseURL || '/admin';
  return url;
};

const downloadFile = (url: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const exportChatRecords = () => {
  const params = new URLSearchParams();
  if (dateRange.value?.[0]) {
    params.set('startDate', dateRange.value[0].format('YYYY-MM-DD'));
  }
  if (dateRange.value?.[1]) {
    params.set('endDate', dateRange.value[1].format('YYYY-MM-DD'));
  }
  const url = `${getBaseURL()}/DataExport/ChatRecords?${params.toString()}`;
  downloadFile(url);
  message.success('开始下载...');
};

const exportSatisfaction = () => {
  const params = new URLSearchParams();
  if (dateRange.value?.[0]) {
    params.set('startDate', dateRange.value[0].format('YYYY-MM-DD'));
  }
  if (dateRange.value?.[1]) {
    params.set('endDate', dateRange.value[1].format('YYYY-MM-DD'));
  }
  const url = `${getBaseURL()}/DataExport/SatisfactionRatings?${params.toString()}`;
  downloadFile(url);
  message.success('开始下载...');
};
</script>

<template>
  <div style="padding: 16px;">
    <Card title="数据导出">
      <div v-if="!canExport" style="text-align: center; padding: 40px;">
        <Tag color="warning" style="font-size: 14px; padding: 6px 16px;">
          未开通数据导出功能，请联系管理员升级套餐
        </Tag>
      </div>

      <template v-else>
        <Row :gutter="[16, 16]" style="margin-bottom: 24px;">
          <Col :span="24">
            <Space>
              <span>日期范围：</span>
              <DatePicker.RangePicker v-model:value="dateRange" />
            </Space>
          </Col>
        </Row>

        <Row :gutter="[16, 16]">
          <Col :xs="24" :sm="12" :md="8">
            <Card size="small" title="聊天记录">
              <p style="color: #666; margin-bottom: 16px;">
                导出访客登录记录，包含访客ID、平台、IP地址等信息。
              </p>
              <Button type="primary" @click="exportChatRecords">
                导出 CSV
              </Button>
            </Card>
          </Col>
          <Col :xs="24" :sm="12" :md="8">
            <Card size="small" title="满意度评价">
              <p style="color: #666; margin-bottom: 16px;">
                导出满意度评价记录，包含评分、标签、评价内容等。
              </p>
              <Button type="primary" @click="exportSatisfaction">
                导出 CSV
              </Button>
            </Card>
          </Col>
        </Row>
      </template>
    </Card>
  </div>
</template>
