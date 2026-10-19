<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Divider,
  Empty,
  Input,
  message,
  Modal,
  Select,
  SelectOption,
  Tag,
} from 'ant-design-vue';

import { useWorkbenchStore } from './store';
import { getTransferableAgents, postTransferVisitor, postUpdateRemark } from './api';

const store = useWorkbenchStore();

const hasActiveVisitor = computed(() => !!store.activeVisitor);

const onlineLabels: Record<number, { text: string; color: string }> = {
  0: { text: '离线', color: 'default' },
  1: { text: '在线', color: 'success' },
};

// 备注编辑
const nicknameRemark = ref('');
const remark = ref('');
const remarkSaving = ref(false);

watch(
  () => store.activeVisitor,
  (visitor) => {
    if (visitor) {
      nicknameRemark.value = visitor.nicknameRemark || '';
      remark.value = visitor.remark || '';
    }
  },
  { immediate: true },
);

const handleSaveRemark = async () => {
  if (!store.activeVisitor) return;
  remarkSaving.value = true;
  try {
    const result: any = await postUpdateRemark(
      store.activeVisitor.id,
      nicknameRemark.value,
      remark.value,
    );
    if (result.code === 0) {
      store.activeVisitor.nicknameRemark = nicknameRemark.value;
      store.activeVisitor.remark = remark.value;
      message.success('备注已保存');
    }
  } finally {
    remarkSaving.value = false;
  }
};

// 转接
const transferVisible = ref(false);
const transferAgents = ref<any[]>([]);
const selectedAgent = ref<number | undefined>(undefined);
const transferring = ref(false);

const showTransfer = async () => {
  const result: any = await getTransferableAgents();
  if (Array.isArray(result)) {
    transferAgents.value = result;
  } else if (result?.data && Array.isArray(result.data)) {
    transferAgents.value = result.data;
  } else {
    transferAgents.value = [];
  }
  selectedAgent.value = undefined;
  transferVisible.value = true;
};

const handleTransfer = async () => {
  if (!store.activeVisitor || !selectedAgent.value) return;
  transferring.value = true;
  try {
    const result: any = await postTransferVisitor(
      store.activeVisitor.id,
      selectedAgent.value,
    );
    if (result.code === 0) {
      message.success('转接成功');
      transferVisible.value = false;
      store.loadVisitors(store.searchKeyword);
      store.selectVisitor(null);
    }
  } finally {
    transferring.value = false;
  }
};

const fmtTime = (v: string) => {
  if (!v) return '-';
  return new Date(v).toLocaleString('zh-CN');
};
</script>

<template>
  <div class="user-detail" v-if="hasActiveVisitor">
    <div class="detail-header">
      <img
        v-if="store.activeVisitor.avatar"
        :src="store.activeVisitor.avatar"
        class="detail-avatar"
      />
      <div v-else class="detail-avatar-placeholder">
        {{ (store.activeVisitor.nicknameRemark || store.activeVisitor.nickname || '?')[0] }}
      </div>
      <div class="detail-name">
        {{ store.activeVisitor.nicknameRemark || store.activeVisitor.nickname || '匿名用户' }}
      </div>
      <Tag :color="onlineLabels[store.activeVisitor.onlineStatus]?.color">
        {{ onlineLabels[store.activeVisitor.onlineStatus]?.text }}
      </Tag>
    </div>

    <Descriptions :column="1" size="small" style="padding: 0 16px;">
      <DescriptionsItem label="ChatUserId">
        <span style="font-size: 11px;">{{ store.activeVisitor.chatUserId }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="用户类型">
        {{ store.activeVisitor.userType === 0 ? '匿名' : store.activeVisitor.userType === 1 ? '注册' : '外部' }}
      </DescriptionsItem>
      <DescriptionsItem label="最后活跃">
        {{ fmtTime(store.activeVisitor.lastActiveTime) }}
      </DescriptionsItem>
    </Descriptions>

    <Divider style="margin: 12px 0;">备注</Divider>

    <div style="padding: 0 16px;">
      <div style="margin-bottom: 8px;">
        <div style="font-size: 12px; color: hsl(var(--muted-foreground)); margin-bottom: 4px;">昵称备注</div>
        <Input
          v-model:value="nicknameRemark"
          placeholder="给用户起个备注名"
          :maxlength="100"
          size="small"
        />
      </div>
      <div style="margin-bottom: 8px;">
        <div style="font-size: 12px; color: hsl(var(--muted-foreground)); margin-bottom: 4px;">详细备注</div>
        <Input.TextArea
          v-model:value="remark"
          placeholder="备注信息"
          :rows="3"
          size="small"
        />
      </div>
      <Button
        type="primary"
        size="small"
        block
        :loading="remarkSaving"
        @click="handleSaveRemark"
      >
        保存备注
      </Button>
    </div>

    <Divider style="margin: 12px 0;">操作</Divider>

    <div style="padding: 0 16px 16px;">
      <Button block @click="showTransfer" style="margin-bottom: 8px;">
        转接客服
      </Button>
    </div>

    <!-- 转接弹窗 -->
    <Modal
      v-model:open="transferVisible"
      title="转接访客"
      @ok="handleTransfer"
      :confirm-loading="transferring"
      ok-text="确认转接"
    >
      <div style="padding: 16px 0;">
        <div style="margin-bottom: 8px; color: hsl(var(--muted-foreground));">
          将 <strong>{{ store.activeVisitor?.nicknameRemark || store.activeVisitor?.nickname }}</strong> 转接给：
        </div>
        <Select
          v-model:value="selectedAgent"
          placeholder="请选择客服"
          style="width: 100%;"
        >
          <SelectOption
            v-for="agent in transferAgents"
            :key="agent.id"
            :value="agent.id"
          >
            {{ agent.name || agent.username }}
            ({{ agent.currentCount }}/{{ agent.maxConcurrent }})
          </SelectOption>
        </Select>
      </div>
    </Modal>
  </div>

  <div v-else class="detail-empty">
    <Empty description="选择访客查看详情" />
  </div>
</template>

<style scoped>
.user-detail {
  padding-top: 16px;
}

.detail-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 16px 16px;
  border-bottom: 1px solid hsl(var(--border));
}

.detail-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 8px;
}

.detail-avatar-placeholder {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
}

.detail-name {
  font-size: 15px;
  font-weight: 500;
  color: hsl(var(--foreground));
  margin-bottom: 4px;
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
