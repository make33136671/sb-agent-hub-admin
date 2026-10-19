<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button,
  Card,
  Col,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  SelectOption,
  Space,
  Statistic,
  Table,
  Tag,
} from 'ant-design-vue';

import { getOwnerOptions } from '../quota/api';
import { getPackageList } from '../quota-package/api';
import {
  cancelOrder,
  confirmPayment,
  createOrder,
  getCurrentPackage,
  getOrderList,
} from './api';

const loading = ref(false);
const orderList = ref<any[]>([]);
const pagination = ref({ current: 1, pageSize: 20, total: 0 });
const filterMemberId = ref<null | number>(null);
const filterStatus = ref<null | number>(null);
const ownerOptions = ref<any[]>([]);
const packageOptions = ref<any[]>([]);

// 创建订单弹窗
const createVisible = ref(false);
const createForm = ref({ memberId: null as null | number, packageId: null as null | number, orderType: 0 });
const createLoading = ref(false);

// 当前套餐
const currentPackage = ref<any>(null);

const columns = [
  { title: '订单号', dataIndex: 'orderNo', width: 200 },
  { title: '套餐', dataIndex: 'packageName', width: 100 },
  { title: '类型', dataIndex: 'orderType', width: 80 },
  { title: '金额', dataIndex: 'amount', width: 100 },
  { title: '状态', dataIndex: 'status', width: 80 },
  { title: '支付方式', dataIndex: 'paymentMethod', width: 100 },
  { title: '生效时间', dataIndex: 'effectiveStartTime', width: 170 },
  { title: '到期时间', dataIndex: 'effectiveEndTime', width: 170 },
  { title: '创建时间', dataIndex: 'createTime', width: 170 },
  { title: '操作', key: 'action', width: 180, fixed: 'right' as const },
];

const orderTypeMap: Record<number, string> = { 0: '新购', 1: '续费', 2: '升级', 3: '降级' };
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待支付', color: 'orange' },
  1: { text: '已支付', color: 'green' },
  2: { text: '已取消', color: 'default' },
  3: { text: '已退款', color: 'red' },
};
const paymentMethodMap: Record<string, string> = {
  manual: '手动收款',
  alipay: '支付宝',
  wechat: '微信',
  trial: '试用',
};

const loadData = async () => {
  loading.value = true;
  try {
    const res: any = await getOrderList({
      memberId: filterMemberId.value ?? undefined,
      status: filterStatus.value ?? undefined,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    orderList.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } finally {
    loading.value = false;
  }
};

const loadOptions = async () => {
  const [owners, packages]: any[] = await Promise.all([
    getOwnerOptions(),
    getPackageList(true),
  ]);
  ownerOptions.value = owners || [];
  packageOptions.value = packages || [];
};

onMounted(() => {
  loadData();
  loadOptions();
});

const handleTableChange = (pag: any) => {
  pagination.value.current = pag.current;
  loadData();
};

const handleFilter = () => {
  pagination.value.current = 1;
  loadData();
};

const openCreate = () => {
  createForm.value = { memberId: null, packageId: null, orderType: 0 };
  createVisible.value = true;
};

const handleCreate = async () => {
  if (!createForm.value.memberId || !createForm.value.packageId) {
    message.warning('请选择站长和套餐!');
    return;
  }
  createLoading.value = true;
  try {
    await createOrder({
      memberId: createForm.value.memberId,
      packageId: createForm.value.packageId,
      orderType: createForm.value.orderType,
      paymentMethod: 'manual',
    });
    message.success('订单创建成功');
    createVisible.value = false;
    loadData();
  } catch (e: any) {
    message.error(e?.message || '创建失败');
  } finally {
    createLoading.value = false;
  }
};

const handleConfirmPayment = async (orderNo: string) => {
  try {
    await confirmPayment(orderNo);
    message.success('支付确认成功，配额已更新');
    loadData();
  } catch (e: any) {
    message.error(e?.message || '操作失败');
  }
};

const handleCancel = async (orderNo: string) => {
  try {
    await cancelOrder(orderNo);
    message.success('订单已取消');
    loadData();
  } catch (e: any) {
    message.error(e?.message || '取消失败');
  }
};

const showCurrentPackage = async (memberId: number) => {
  try {
    const res: any = await getCurrentPackage(memberId);
    currentPackage.value = res;
  } catch {
    currentPackage.value = null;
  }
};

const onMemberChange = (val: number) => {
  if (val) showCurrentPackage(val);
};
</script>

<template>
  <div style="padding: 16px">
    <Card title="订单管理">
      <template #extra>
        <Button type="primary" @click="openCreate">创建订单</Button>
      </template>

      <!-- 筛选 -->
      <Row :gutter="[16, 16]" style="margin-bottom: 16px">
        <Col>
          <Space>
            <Select
              v-model:value="filterMemberId"
              placeholder="筛选站长"
              allow-clear
              show-search
              :filter-option="(input: string, option: any) => (option?.label || '').toLowerCase().includes(input.toLowerCase())"
              style="width: 180px"
              @change="handleFilter"
            >
              <SelectOption
                v-for="o in ownerOptions"
                :key="o.id"
                :value="o.id"
                :label="o.name || o.username"
              >
                {{ o.name || o.username }}
              </SelectOption>
            </Select>
            <Select
              v-model:value="filterStatus"
              placeholder="筛选状态"
              allow-clear
              style="width: 120px"
              @change="handleFilter"
            >
              <SelectOption :value="0">待支付</SelectOption>
              <SelectOption :value="1">已支付</SelectOption>
              <SelectOption :value="2">已取消</SelectOption>
              <SelectOption :value="3">已退款</SelectOption>
            </Select>
          </Space>
        </Col>
      </Row>

      <Table
        :columns="columns"
        :data-source="orderList"
        :loading="loading"
        :pagination="pagination"
        :scroll="{ x: 1400 }"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'orderType'">
            {{ orderTypeMap[record.orderType] || record.orderType }}
          </template>
          <template v-if="column.dataIndex === 'amount'">
            <span v-if="record.amount === 0" style="color: #52c41a">免费</span>
            <span v-else>¥{{ record.amount }}</span>
          </template>
          <template v-if="column.dataIndex === 'status'">
            <Tag :color="statusMap[record.status]?.color || 'default'">
              {{ statusMap[record.status]?.text || record.status }}
            </Tag>
          </template>
          <template v-if="column.dataIndex === 'paymentMethod'">
            {{ paymentMethodMap[record.paymentMethod] || record.paymentMethod }}
          </template>
          <template v-if="column.key === 'action'">
            <Space v-if="record.status === 0">
              <Popconfirm title="确认已收款？" @confirm="handleConfirmPayment(record.orderNo)">
                <Button size="small" type="link">确认支付</Button>
              </Popconfirm>
              <Popconfirm title="确定取消订单？" @confirm="handleCancel(record.orderNo)">
                <Button danger size="small" type="link">取消</Button>
              </Popconfirm>
            </Space>
            <span v-else style="color: #999">-</span>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 创建订单弹窗 -->
    <Modal
      title="创建订单"
      :open="createVisible"
      :confirm-loading="createLoading"
      @ok="handleCreate"
      @cancel="createVisible = false"
    >
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div>
          <div style="margin-bottom: 4px">选择站长</div>
          <Select
            v-model:value="createForm.memberId"
            placeholder="请选择站长"
            show-search
            :filter-option="(input: string, option: any) => (option?.label || '').toLowerCase().includes(input.toLowerCase())"
            style="width: 100%"
            @change="onMemberChange"
          >
            <SelectOption
              v-for="o in ownerOptions"
              :key="o.id"
              :value="o.id"
              :label="o.name || o.username"
            >
              {{ o.name || o.username }} (ID: {{ o.id }})
            </SelectOption>
          </Select>
        </div>

        <!-- 当前套餐信息 -->
        <Card v-if="currentPackage?.hasPackage" size="small" style="background: #f6ffed">
          <Row :gutter="16">
            <Col :span="8"><Statistic title="当前套餐" :value="currentPackage.packageName" /></Col>
            <Col :span="8"><Statistic title="剩余天数" :value="currentPackage.daysRemaining" suffix="天" /></Col>
          </Row>
        </Card>

        <div>
          <div style="margin-bottom: 4px">选择套餐</div>
          <Select v-model:value="createForm.packageId" placeholder="请选择套餐" style="width: 100%">
            <SelectOption v-for="p in packageOptions" :key="p.id" :value="p.id">
              {{ p.packageName }} - ¥{{ p.price }}/{{ p.pricePeriod === 'year' ? '年' : '月' }}
            </SelectOption>
          </Select>
        </div>

        <div>
          <div style="margin-bottom: 4px">订单类型</div>
          <Select v-model:value="createForm.orderType" style="width: 100%">
            <SelectOption :value="0">新购</SelectOption>
            <SelectOption :value="1">续费</SelectOption>
            <SelectOption :value="2">升级</SelectOption>
            <SelectOption :value="3">降级</SelectOption>
          </Select>
        </div>
      </div>
    </Modal>
  </div>
</template>
