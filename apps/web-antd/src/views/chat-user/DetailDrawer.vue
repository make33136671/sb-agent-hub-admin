<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Divider,
  Input,
  message,
  Spin,
  Tag,
} from 'ant-design-vue';

import { getDetail, postUpdateRemark } from './api';

const props = defineProps<{
  userId: number;
}>();

const emit = defineEmits<{
  updated: [];
}>();

const loading = ref(false);
const detail = ref<any>(null);

const nicknameRemark = ref('');
const remark = ref('');
const saving = ref(false);

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

const fmtTime = (v: string) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('zh-CN');
};

onMounted(async () => {
  loading.value = true;
  try {
    detail.value = await getDetail(props.userId);
    nicknameRemark.value = detail.value?.nicknameRemark || '';
    remark.value = detail.value?.remark || '';
  } finally {
    loading.value = false;
  }
});

const handleSaveRemark = async () => {
  saving.value = true;
  try {
    const result: any = await postUpdateRemark(
      props.userId,
      nicknameRemark.value,
      remark.value,
    );
    if (result.code === 0) {
      message.success('备注保存成功');
      emit('updated');
    }
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <Spin :spinning="loading">
    <template v-if="detail">
      <div style="text-align: center; margin-bottom: 16px;">
        <img
          v-if="detail.avatar"
          :src="detail.avatar"
          style="width: 64px; height: 64px; border-radius: 50%; object-fit: cover;"
        />
        <div style="margin-top: 8px; font-size: 16px; font-weight: 500;">
          {{ detail.nickname || '匿名用户' }}
        </div>
        <div style="color: #999; font-size: 12px;">{{ detail.chatUserId }}</div>
      </div>

      <Descriptions :column="1" bordered size="small">
        <DescriptionsItem label="用户类型">
          {{ userTypeLabels[detail.userType] || '未知' }}
        </DescriptionsItem>
        <DescriptionsItem label="在线状态">
          <Tag :color="onlineLabels[detail.onlineStatus]?.color">
            {{ onlineLabels[detail.onlineStatus]?.text }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="用户状态">
          <Tag :color="statusLabels[detail.status]?.color">
            {{ statusLabels[detail.status]?.text }}
          </Tag>
        </DescriptionsItem>
        <DescriptionsItem label="所属平台">
          #{{ detail.platformId }}
        </DescriptionsItem>
        <DescriptionsItem label="分配客服">
          {{ detail.assignedAgentId ? `#${detail.assignedAgentId}` : '未分配' }}
        </DescriptionsItem>
        <DescriptionsItem label="设备类型">
          {{ detail.deviceType || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="最后IP">
          {{ detail.lastLoginIp || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="IP归属地">
          {{ detail.ipLocation || '-' }}
        </DescriptionsItem>
        <DescriptionsItem label="首次访问">
          {{ fmtTime(detail.firstVisitTime) }}
        </DescriptionsItem>
        <DescriptionsItem label="最后活跃">
          {{ fmtTime(detail.lastActiveTime) }}
        </DescriptionsItem>
      </Descriptions>

      <Divider>备注信息</Divider>

      <div style="margin-bottom: 12px;">
        <div style="margin-bottom: 4px; font-size: 13px; color: #666;">昵称备注</div>
        <Input
          v-model:value="nicknameRemark"
          placeholder="给用户起个备注名"
          :maxlength="100"
          allow-clear
        />
      </div>

      <div style="margin-bottom: 12px;">
        <div style="margin-bottom: 4px; font-size: 13px; color: #666;">详细备注</div>
        <Input.TextArea
          v-model:value="remark"
          placeholder="记录用户相关信息"
          :rows="3"
        />
      </div>

      <Button
        type="primary"
        block
        :loading="saving"
        @click="handleSaveRemark"
      >
        保存备注
      </Button>
    </template>
  </Spin>
</template>
