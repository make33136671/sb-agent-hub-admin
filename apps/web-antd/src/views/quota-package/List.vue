<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import {
  Button,
  Card,
  Drawer,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag,
  Textarea,
} from 'ant-design-vue';

import { getOwnerOptions } from '../quota/api';
import {
  applyPackage,
  createPackage,
  deletePackage,
  getPackageList,
  updatePackage,
} from './api';

const loading = ref(false);
const packageList = ref<any[]>([]);
const drawerVisible = ref(false);
const editingId = ref<null | number>(null);
const applyModalVisible = ref(false);
const applyPackageId = ref(0);
const applyMemberId = ref<null | number>(null);
const ownerOptions = ref<any[]>([]);
const applyLoading = ref(false);

const formState = reactive({
  packageName: '',
  packageKey: '',
  description: '',
  price: 0,
  pricePeriod: 'month',
  quotaSettings: '{}',
  sortOrder: 0,
  isEnabled: true,
});

const columns = [
  { title: '套餐名称', dataIndex: 'packageName', width: 120 },
  { title: '标识', dataIndex: 'packageKey', width: 100 },
  { title: '价格', dataIndex: 'price', width: 100 },
  { title: '周期', dataIndex: 'pricePeriod', width: 80 },
  { title: '描述', dataIndex: 'description', ellipsis: true },
  { title: '排序', dataIndex: 'sortOrder', width: 70 },
  { title: '状态', dataIndex: 'isEnabled', width: 80 },
  { title: '操作', key: 'action', width: 220 },
];

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getPackageList();
    packageList.value = res || [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);

const resetForm = () => {
  formState.packageName = '';
  formState.packageKey = '';
  formState.description = '';
  formState.price = 0;
  formState.pricePeriod = 'month';
  formState.quotaSettings = '{}';
  formState.sortOrder = 0;
  formState.isEnabled = true;
};

const openCreate = () => {
  editingId.value = null;
  resetForm();
  drawerVisible.value = true;
};

const openEdit = (record: any) => {
  editingId.value = record.id;
  formState.packageName = record.packageName;
  formState.packageKey = record.packageKey;
  formState.description = record.description;
  formState.price = record.price;
  formState.pricePeriod = record.pricePeriod;
  formState.quotaSettings =
    typeof record.quotaSettings === 'string'
      ? record.quotaSettings
      : JSON.stringify(record.quotaSettings, null, 2);
  formState.sortOrder = record.sortOrder;
  formState.isEnabled = record.isEnabled;
  drawerVisible.value = true;
};

const handleSave = async () => {
  try {
    // 验证 JSON
    JSON.parse(formState.quotaSettings);
  } catch {
    message.error('配额配置 JSON 格式错误!');
    return;
  }

  try {
    if (editingId.value) {
      await updatePackage({
        id: editingId.value,
        ...formState,
      });
      message.success('更新成功');
    } else {
      await createPackage(formState);
      message.success('创建成功');
    }
    drawerVisible.value = false;
    loadData();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  }
};

const handleDelete = async (id: number) => {
  try {
    await deletePackage(id);
    message.success('删除成功');
    loadData();
  } catch (e: any) {
    message.error(e?.message || '删除失败');
  }
};

const openApply = async (record: any) => {
  applyPackageId.value = record.id;
  applyMemberId.value = null;
  applyModalVisible.value = true;
  if (ownerOptions.value.length === 0) {
    const res: any = await getOwnerOptions();
    ownerOptions.value = res || [];
  }
};

const handleApply = async () => {
  if (!applyMemberId.value) {
    message.warning('请选择站长!');
    return;
  }
  applyLoading.value = true;
  try {
    await applyPackage(applyPackageId.value, applyMemberId.value);
    message.success('套餐应用成功!');
    applyModalVisible.value = false;
  } catch (e: any) {
    message.error(e?.message || '应用失败');
  } finally {
    applyLoading.value = false;
  }
};

const formatPrice = (price: number, period: string) => {
  if (price === 0) return '免费';
  return `¥${price}/${period === 'year' ? '年' : '月'}`;
};

const formatQuotaSettings = (json: string) => {
  try {
    const obj = JSON.parse(json);
    return Object.keys(obj).length;
  } catch {
    return 0;
  }
};
</script>

<template>
  <div style="padding: 16px">
    <Card title="套餐模板管理">
      <template #extra>
        <Button type="primary" @click="openCreate">新建套餐</Button>
      </template>

      <Table
        :columns="columns"
        :data-source="packageList"
        :loading="loading"
        :pagination="false"
        row-key="id"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'price'">
            {{ formatPrice(record.price, record.pricePeriod) }}
          </template>
          <template v-if="column.dataIndex === 'pricePeriod'">
            {{ record.pricePeriod === 'year' ? '年付' : '月付' }}
          </template>
          <template v-if="column.dataIndex === 'isEnabled'">
            <Tag :color="record.isEnabled ? 'green' : 'default'">
              {{ record.isEnabled ? '启用' : '停用' }}
            </Tag>
          </template>
          <template v-if="column.key === 'action'">
            <Space>
              <Button size="small" type="link" @click="openEdit(record)">
                编辑
              </Button>
              <Button size="small" type="link" @click="openApply(record)">
                应用
              </Button>
              <Popconfirm
                title="确定删除该套餐?"
                @confirm="handleDelete(record.id)"
              >
                <Button danger size="small" type="link">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 新建/编辑抽屉 -->
    <Drawer
      :title="editingId ? '编辑套餐' : '新建套餐'"
      :open="drawerVisible"
      :width="520"
      @close="drawerVisible = false"
    >
      <Form layout="vertical">
        <FormItem label="套餐名称" required>
          <Input v-model:value="formState.packageName" placeholder="如：基础版" />
        </FormItem>
        <FormItem v-if="!editingId" label="套餐标识" required>
          <Input
            v-model:value="formState.packageKey"
            placeholder="如：basic"
            :disabled="!!editingId"
          />
        </FormItem>
        <FormItem label="描述">
          <Textarea
            v-model:value="formState.description"
            :rows="2"
            placeholder="套餐说明"
          />
        </FormItem>
        <FormItem label="价格">
          <Space>
            <InputNumber
              v-model:value="formState.price"
              :min="0"
              :precision="2"
              style="width: 150px"
            />
            <Select v-model:value="formState.pricePeriod" style="width: 100px">
              <SelectOption value="month">月付</SelectOption>
              <SelectOption value="year">年付</SelectOption>
            </Select>
          </Space>
        </FormItem>
        <FormItem label="配额配置 (JSON)">
          <Textarea
            v-model:value="formState.quotaSettings"
            :rows="8"
            placeholder='{"max_platforms": 1, "max_agents": 3}'
            style="font-family: monospace"
          />
          <div style="color: #999; font-size: 12px; margin-top: 4px">
            JSON 格式，key 为配额标识，value 为配额值
          </div>
        </FormItem>
        <FormItem label="排序">
          <InputNumber v-model:value="formState.sortOrder" :min="0" />
        </FormItem>
        <FormItem label="启用">
          <Switch v-model:checked="formState.isEnabled" />
        </FormItem>
        <FormItem>
          <Space>
            <Button type="primary" @click="handleSave">保存</Button>
            <Button @click="drawerVisible = false">取消</Button>
          </Space>
        </FormItem>
      </Form>
    </Drawer>

    <!-- 应用套餐弹窗 -->
    <Modal
      title="应用套餐"
      :open="applyModalVisible"
      :confirm-loading="applyLoading"
      @ok="handleApply"
      @cancel="applyModalVisible = false"
    >
      <Form layout="vertical">
        <FormItem label="选择站长" required>
          <Select
            v-model:value="applyMemberId"
            placeholder="请选择站长"
            show-search
            :filter-option="
              (input: string, option: any) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
            "
            style="width: 100%"
          >
            <SelectOption
              v-for="owner in ownerOptions"
              :key="owner.id"
              :value="owner.id"
              :label="owner.name || owner.username"
            >
              {{ owner.name || owner.username }} (ID: {{ owner.id }})
            </SelectOption>
          </Select>
        </FormItem>
        <div style="color: #ff7a45; font-size: 12px">
          注意：应用套餐将覆盖站长现有的配额设置
        </div>
      </Form>
    </Modal>
  </div>
</template>
