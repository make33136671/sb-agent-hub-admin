<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { Card, Col, Progress, Row, Select as ASelect, Statistic, Tag } from 'ant-design-vue';

import { getOwnerOptions, getUsageSummary } from './api';

const ownerOptions = ref<any[]>([]);
const selectedOwnerId = ref<number | undefined>();
const usageData = ref<any[]>([]);
const loading = ref(false);

onMounted(async () => {
  const res: any = await getOwnerOptions();
  ownerOptions.value = (res || []).map((o: any) => ({
    label: o.name || o.username,
    value: o.id,
  }));
  if (ownerOptions.value.length > 0) {
    selectedOwnerId.value = ownerOptions.value[0].value;
  }
});

watch(selectedOwnerId, async (val) => {
  if (!val) return;
  loading.value = true;
  try {
    const res: any = await getUsageSummary(val);
    usageData.value = res || [];
  } finally {
    loading.value = false;
  }
}, { immediate: true });

const getProgressStatus = (percent: number) => {
  if (percent >= 95) return 'exception';
  if (percent >= 80) return 'active';
  return 'normal';
};

const getTagColor = (percent: number) => {
  if (percent >= 95) return 'error';
  if (percent >= 80) return 'warning';
  return 'success';
};

const getTagText = (percent: number) => {
  if (percent >= 95) return '即将超限';
  if (percent >= 80) return '较高';
  return '正常';
};
</script>

<template>
  <div style="padding: 16px;">
    <Card title="配额用量面板" style="margin-bottom: 16px;">
      <template #extra>
        <ASelect
          v-model:value="selectedOwnerId"
          placeholder="选择站长"
          :options="ownerOptions"
          style="width: 200px;"
        />
      </template>

      <div v-if="!selectedOwnerId" style="text-align: center; padding: 40px; color: #999;">
        请选择一个站长查看配额用量
      </div>

      <Row v-else :gutter="[16, 16]">
        <Col v-for="item in usageData" :key="item.quotaKey" :xs="24" :sm="12" :md="8" :lg="6">
          <Card size="small" :loading="loading">
            <Statistic
              :title="item.quotaName"
              :value="item.used"
              :suffix="`/ ${item.limit} ${item.unit}`"
            />
            <Progress
              :percent="item.usagePercent"
              :status="getProgressStatus(item.usagePercent)"
              :stroke-width="8"
              style="margin-top: 8px;"
            />
            <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 12px; color: #999;">
                剩余: {{ item.remaining }} {{ item.unit }}
              </span>
              <Tag :color="getTagColor(item.usagePercent)" style="margin: 0;">
                {{ getTagText(item.usagePercent) }}
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

      <div v-if="selectedOwnerId && usageData.length === 0 && !loading" style="text-align: center; padding: 40px; color: #999;">
        暂无配额数据
      </div>
    </Card>
  </div>
</template>
