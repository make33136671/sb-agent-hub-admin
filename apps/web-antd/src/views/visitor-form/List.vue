<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { createForm, deleteForm, getFormList, updateForm } from './api';

interface FormRow {
  id: number;
  platformId: number;
  formName: string;
  formFields: string;
  isRequired: boolean;
  isEnabled: boolean;
  createTime: string;
}

const dataSource = ref<FormRow[]>([]);
const loading = ref(false);
const drawerVisible = ref(false);
const editingForm = ref<Partial<FormRow>>({});
const isEdit = ref(false);

const columns = [
  { title: 'ID', dataIndex: 'id', width: 60 },
  { title: '表单名称', dataIndex: 'formName' },
  { title: '平台ID', dataIndex: 'platformId', width: 80 },
  { title: '必填', dataIndex: 'isRequired', width: 60 },
  { title: '启用', dataIndex: 'isEnabled', width: 60 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 150 },
];

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getFormList();
    dataSource.value = Array.isArray(res) ? res : [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const openCreate = () => {
  isEdit.value = false;
  editingForm.value = {
    platformId: 0,
    formName: '访客信息',
    formFields: JSON.stringify([
      { key: 'name', label: '姓名', type: 'text', required: true, placeholder: '请输入姓名' },
      { key: 'phone', label: '手机号', type: 'phone', required: false, placeholder: '请输入手机号' },
    ], null, 2),
    isRequired: true,
    isEnabled: true,
  };
  drawerVisible.value = true;
};

const openEdit = (row: FormRow) => {
  isEdit.value = true;
  editingForm.value = {
    ...row,
    formFields: typeof row.formFields === 'string'
      ? JSON.stringify(JSON.parse(row.formFields), null, 2)
      : JSON.stringify(row.formFields, null, 2),
  };
  drawerVisible.value = true;
};

const handleSave = async () => {
  const form = editingForm.value;
  try {
    JSON.parse(form.formFields || '[]');
  } catch {
    message.error('表单字段JSON格式错误');
    return;
  }

  try {
    if (isEdit.value) {
      await updateForm({
        id: form.id!,
        formName: form.formName || '',
        formFields: form.formFields || '[]',
        isRequired: form.isRequired ?? true,
        isEnabled: form.isEnabled ?? true,
      });
      message.success('更新成功');
    } else {
      await createForm({
        platformId: form.platformId || 0,
        formName: form.formName || '访客信息',
        formFields: form.formFields || '[]',
        isRequired: form.isRequired ?? true,
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
  await deleteForm(id);
  message.success('删除成功');
  await loadData();
};
</script>

<template>
  <div style="padding: 16px;">
    <Card title="访客信息收集表单">
      <template #extra>
        <Button type="primary" @click="openCreate">新建表单</Button>
      </template>

      <Table
        :columns="columns"
        :data-source="dataSource"
        :loading="loading"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'isRequired'">
            <Tag :color="record.isRequired ? 'blue' : 'default'">
              {{ record.isRequired ? '是' : '否' }}
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
      :title="isEdit ? '编辑表单' : '新建表单'"
      width="500"
      @close="drawerVisible = false"
    >
      <Form layout="vertical">
        <FormItem label="表单名称">
          <Input v-model:value="editingForm.formName" />
        </FormItem>
        <FormItem v-if="!isEdit" label="平台ID (0=全局)">
          <Input v-model:value="editingForm.platformId" type="number" />
        </FormItem>
        <FormItem label="表单字段 (JSON)">
          <Textarea v-model:value="editingForm.formFields" :rows="10" />
        </FormItem>
        <FormItem label="必须填写">
          <Switch v-model:checked="editingForm.isRequired" />
        </FormItem>
        <FormItem v-if="isEdit" label="启用">
          <Switch v-model:checked="editingForm.isEnabled" />
        </FormItem>
        <FormItem>
          <Button type="primary" @click="handleSave">保存</Button>
        </FormItem>
      </Form>
    </Drawer>
  </div>
</template>
