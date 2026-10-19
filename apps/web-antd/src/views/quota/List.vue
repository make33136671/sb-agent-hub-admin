<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  InputNumber,
  message,
  Progress,
  Select as ASelect,
  Space,
  Table,
  Tag,
  Input,
} from 'ant-design-vue';

import { getMemberQuotas, getOwnerOptions, postSetQuota } from './api';

const ownerOptions = ref<any[]>([]);
const selectedOwnerId = ref<number | undefined>();
const quotaList = ref<any[]>([]);
const loading = ref(false);

onMounted(async () => {
  const res: any = await getOwnerOptions();
  ownerOptions.value = (res || []).map((o: any) => ({
    label: o.name || o.username,
    value: o.id,
  }));
});

watch(selectedOwnerId, async (val) => {
  if (!val) {
    quotaList.value = [];
    return;
  }
  await loadQuotas(val);
});

async function loadQuotas(memberId: number) {
  loading.value = true;
  try {
    const res: any = await getMemberQuotas(memberId);
    quotaList.value = (res || []).map((q: any) => ({
      ...q,
      editValue: q.quotaValue,
      editing: false,
    }));
  } finally {
    loading.value = false;
  }
}

async function saveQuota(record: any) {
  if (!selectedOwnerId.value) return;
  const result: any = await postSetQuota({
    memberId: selectedOwnerId.value,
    quotaKey: record.quotaKey,
    quotaValue: record.editValue,
    remark: record.editRemark || '',
  });
  if (result.code === 0) {
    message.success('配额设置成功');
    record.editing = false;
    await loadQuotas(selectedOwnerId.value);
  }
}

function startEdit(record: any) {
  record.editing = true;
  record.editValue = record.quotaValue;
  record.editRemark = '';
}

function cancelEdit(record: any) {
  record.editing = false;
}

function getUsageColor(percent: number) {
  if (percent >= 95) return '#ff4d4f';
  if (percent >= 80) return '#faad14';
  return '#52c41a';
}

const columns = [
  { title: '配额项', dataIndex: 'quotaName', key: 'quotaName', width: 160 },
  { title: '配额值', key: 'quotaValue', width: 160 },
  { title: '使用情况', key: 'usage', width: 260 },
  { title: '状态', key: 'status', width: 100 },
  { title: '备注', key: 'remark', width: 150 },
  { title: '操作', key: 'action', width: 160 },
];
</script>

<template>
  <Page auto-content-height>
    <Card title="配额管理" style="margin: 10px;">
      <template #extra>
        <ASelect
          v-model:value="selectedOwnerId"
          placeholder="请选择站长"
          :options="ownerOptions"
          show-search
          :filter-option="(input: string, option: any) =>
            (option?.label || '').toLowerCase().includes(input.toLowerCase())
          "
          style="width: 240px;"
          allow-clear
        />
      </template>

      <div v-if="!selectedOwnerId" style="text-align: center; padding: 60px 0; color: #999;">
        请先选择一个站长来查看和管理配额
      </div>

      <Table
        v-else
        :columns="columns"
        :data-source="quotaList"
        :loading="loading"
        :pagination="false"
        row-key="quotaKey"
        size="middle"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'quotaValue'">
            <template v-if="record.editing">
              <InputNumber
                v-model:value="record.editValue"
                :min="record.minValue"
                :max="record.maxValue"
                style="width: 120px;"
              />
              <span style="margin-left: 4px; color: #999;">{{ record.unit }}</span>
            </template>
            <template v-else>
              <span style="font-weight: 600; font-size: 16px;">{{ record.quotaValue }}</span>
              <span style="margin-left: 4px; color: #999;">{{ record.unit }}</span>
              <Tag v-if="record.isCustomized" color="blue" style="margin-left: 8px;">已自定义</Tag>
              <Tag v-else color="default" style="margin-left: 8px;">默认值</Tag>
            </template>
          </template>

          <template v-if="column.key === 'usage'">
            <template v-if="record.quotaType === 0">
              <div style="display: flex; align-items: center; gap: 8px;">
                <Progress
                  :percent="record.quotaValue > 0 ? Math.round(record.currentUsage / record.quotaValue * 100) : 0"
                  :stroke-color="getUsageColor(record.quotaValue > 0 ? record.currentUsage / record.quotaValue * 100 : 0)"
                  :show-info="false"
                  style="width: 100px;"
                  size="small"
                />
                <span>{{ record.currentUsage }} / {{ record.quotaValue }}</span>
              </div>
            </template>
            <template v-else-if="record.quotaType === 1">
              <Tag :color="record.quotaValue > 0 ? 'success' : 'default'">
                {{ record.quotaValue > 0 ? '已启用' : '未启用' }}
              </Tag>
            </template>
          </template>

          <template v-if="column.key === 'status'">
            <Tag v-if="record.remaining <= 0 && record.quotaType === 0" color="error">已满</Tag>
            <Tag v-else-if="record.remaining <= 1 && record.quotaType === 0" color="warning">即将满额</Tag>
            <Tag v-else color="success">正常</Tag>
          </template>

          <template v-if="column.key === 'remark'">
            <template v-if="record.editing">
              <Input v-model:value="record.editRemark" placeholder="备注" style="width: 120px;" />
            </template>
            <template v-else>
              <span style="color: #999;">{{ record.remark || '-' }}</span>
            </template>
          </template>

          <template v-if="column.key === 'action'">
            <Space>
              <template v-if="record.editing">
                <Button type="primary" size="small" @click="saveQuota(record)">保存</Button>
                <Button size="small" @click="cancelEdit(record)">取消</Button>
              </template>
              <template v-else>
                <Button type="primary" size="small" @click="startEdit(record)">设置</Button>
              </template>
            </Space>
          </template>
        </template>
      </Table>
    </Card>
  </Page>
</template>
