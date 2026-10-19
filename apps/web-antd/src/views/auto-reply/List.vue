<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select as ASelect,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { createRule, deleteRule, getRuleList, updateRule } from './api';

interface RuleRow {
  id: number;
  platformId: number;
  triggerType: number;
  keywords: string;
  matchType: number;
  replyContent: string;
  replyType: number;
  priority: number;
  isEnabled: boolean;
  createTime: string;
}

const dataSource = ref<RuleRow[]>([]);
const loading = ref(false);
const drawerVisible = ref(false);
const editingRule = ref<Partial<RuleRow>>({});
const isEdit = ref(false);

const triggerTypeOptions = [
  { label: '关键词匹配', value: 0 },
  { label: '首次接入', value: 1 },
  { label: '无客服在线', value: 2 },
];

const matchTypeOptions = [
  { label: '包含', value: 0 },
  { label: '完全匹配', value: 1 },
  { label: '正则', value: 2 },
];

const triggerTypeMap: Record<number, { text: string; color: string }> = {
  0: { text: '关键词', color: 'blue' },
  1: { text: '首次接入', color: 'green' },
  2: { text: '无客服', color: 'orange' },
};

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '触发类型', dataIndex: 'triggerType', width: 100 },
  { title: '关键词', dataIndex: 'keywords', ellipsis: true },
  { title: '回复内容', dataIndex: 'replyContent', ellipsis: true },
  { title: '优先级', dataIndex: 'priority', width: 80 },
  { title: '启用', dataIndex: 'isEnabled', width: 60 },
  { title: '操作', key: 'action', width: 150 },
];

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getRuleList();
    dataSource.value = Array.isArray(res) ? res : [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const openCreate = () => {
  isEdit.value = false;
  editingRule.value = {
    platformId: 0,
    triggerType: 0,
    keywords: '',
    matchType: 0,
    replyContent: '',
    replyType: 0,
    priority: 0,
    isEnabled: true,
  };
  drawerVisible.value = true;
};

const openEdit = (row: RuleRow) => {
  isEdit.value = true;
  editingRule.value = { ...row };
  drawerVisible.value = true;
};

const handleSave = async () => {
  const rule = editingRule.value;
  try {
    if (isEdit.value) {
      await updateRule({
        id: rule.id!,
        triggerType: rule.triggerType ?? 0,
        keywords: rule.keywords || '',
        matchType: rule.matchType ?? 0,
        replyContent: rule.replyContent || '',
        replyType: rule.replyType ?? 0,
        priority: rule.priority ?? 0,
        isEnabled: rule.isEnabled ?? true,
      });
      message.success('更新成功');
    } else {
      await createRule({
        platformId: rule.platformId || 0,
        triggerType: rule.triggerType ?? 0,
        keywords: rule.keywords || '',
        matchType: rule.matchType ?? 0,
        replyContent: rule.replyContent || '',
        replyType: rule.replyType ?? 0,
        priority: rule.priority ?? 0,
      });
      message.success('创建成功');
    }
    drawerVisible.value = false;
    await loadData();
  } catch {
    message.error('操作失败');
  }
};

const handleDelete = async (id: number) => {
  await deleteRule(id);
  message.success('删除成功');
  await loadData();
};
</script>

<template>
  <div style="padding: 16px;">
    <Card title="自动回复规则">
      <template #extra>
        <Button type="primary" @click="openCreate">新建规则</Button>
      </template>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'triggerType'">
            <Tag :color="triggerTypeMap[record.triggerType]?.color || 'default'">
              {{ triggerTypeMap[record.triggerType]?.text || '未知' }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'isEnabled'">
            <Tag :color="record.isEnabled ? 'green' : 'default'">
              {{ record.isEnabled ? '启用' : '禁用' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button size="small" @click="openEdit(record)">编辑</Button>
              <Popconfirm title="确认删除?" @confirm="handleDelete(record.id)">
                <Button size="small" danger>删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <Drawer
      :open="drawerVisible"
      :title="isEdit ? '编辑规则' : '新建规则'"
      width="500"
      @close="drawerVisible = false"
    >
      <Form layout="vertical">
        <FormItem label="触发类型">
          <ASelect v-model:value="editingRule.triggerType" :options="triggerTypeOptions" />
        </FormItem>
        <FormItem v-if="editingRule.triggerType === 0" label="关键词 (逗号分隔)">
          <Input v-model:value="editingRule.keywords" placeholder="你好,hello,咨询" />
        </FormItem>
        <FormItem v-if="editingRule.triggerType === 0" label="匹配方式">
          <ASelect v-model:value="editingRule.matchType" :options="matchTypeOptions" />
        </FormItem>
        <FormItem label="回复内容">
          <Textarea v-model:value="editingRule.replyContent" :rows="4" />
        </FormItem>
        <FormItem label="优先级 (数字越大越优先)">
          <InputNumber v-model:value="editingRule.priority" :min="0" />
        </FormItem>
        <FormItem v-if="isEdit" label="启用">
          <Switch v-model:checked="editingRule.isEnabled" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSave">保存</Button>
        </FormItem>
      </Form>
    </Drawer>
  </div>
</template>
