<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Card,
  Col,
  Progress,
  Rate,
  Row,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import { getRatingList, getStatistics } from './api';

const stats = ref<any>({ total: 0, average: 0, distribution: [0, 0, 0, 0, 0] });
const ratingList = ref<any[]>([]);
const loading = ref(false);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });

const columns = [
  { title: '访客ID', dataIndex: 'chatUserId', ellipsis: true, width: 150 },
  { title: '客服ID', dataIndex: 'agentId', width: 80 },
  { title: '评分', dataIndex: 'rating', width: 100 },
  { title: '标签', dataIndex: 'tags', ellipsis: true },
  { title: '评价', dataIndex: 'comment', ellipsis: true },
  { title: '时间', dataIndex: 'createTime', width: 170 },
];

const loadData = async () => {
  loading.value = true;
  try {
    const [statsRes, listRes]: any[] = await Promise.all([
      getStatistics(),
      getRatingList({ page: pagination.value.current, pageSize: pagination.value.pageSize }),
    ]);
    stats.value = statsRes || { total: 0, average: 0, distribution: [0, 0, 0, 0, 0] };
    ratingList.value = listRes?.items || [];
    pagination.value.total = listRes?.dataCount || 0;
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  loadData();
};

const ratingLabels = ['非常差', '较差', '一般', '满意', '非常满意'];
const ratingColors = ['#ff4d4f', '#ff7a45', '#ffa940', '#52c41a', '#1890ff'];
</script>

<template>
  <div style="padding: 16px;">
    <Card title="满意度统计" style="margin-bottom: 16px;">
      <Row :gutter="[24, 16]">
        <Col :xs="24" :sm="8">
          <Statistic title="总评价数" :value="stats.total" />
        </Col>
        <Col :xs="24" :sm="8">
          <Statistic title="平均评分" :value="stats.average" :precision="1" suffix="/ 5" />
          <Rate :value="stats.average" disabled allow-half style="margin-top: 8px;" />
        </Col>
        <Col :xs="24" :sm="8">
          <div v-for="(count, index) in stats.distribution" :key="index" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
            <span style="width: 60px; font-size: 12px; color: #666;">{{ ratingLabels[index] }}</span>
            <Progress
              :percent="stats.total > 0 ? Math.round(count / stats.total * 100) : 0"
              :stroke-color="ratingColors[index]"
              :show-info="false"
              size="small"
              style="flex: 1;"
            />
            <span style="width: 30px; font-size: 12px; text-align: right;">{{ count }}</span>
          </div>
        </Col>
      </Row>
    </Card>

    <Card title="评价列表">
      <Table
        :columns="columns"
        :data-source="ratingList"
        :loading="loading"
        :pagination="pagination"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'rating'">
            <Rate :value="record.rating" disabled :count="5" style="font-size: 14px;" />
          </template>
          <template v-if="column.dataIndex === 'tags'">
            <Tag v-for="tag in (record.tags || '').split(',').filter(Boolean)" :key="tag">
              {{ tag }}
            </Tag>
          </template>
        </template>
      </Table>
    </Card>
  </div>
</template>
