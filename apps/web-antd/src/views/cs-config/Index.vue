<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Radio,
  RadioGroup,
  Row,
  Spin,
  Switch,
  TimePicker,
} from 'ant-design-vue';

import dayjs from 'dayjs';

import { getConfig, saveConfig } from './api';

const loading = ref(false);
const saving = ref(false);

const formData = ref({
  id: 0,
  allocationRule: 0,
  offlineHandling: 2,
  offlineAutoReply: '',
  enableWorkTime: false,
  workTimeStart: '09:00',
  workTimeEnd: '18:00',
  nonWorkTimeMessage: '',
  enableQueue: false,
  maxConcurrentSessions: 50,
  enableBroadcast: false,
});

const allocationRules = [
  { label: '轮询分配', value: 0, desc: '按顺序依次分配给各客服' },
  { label: '最少优先', value: 1, desc: '优先分配给当前接待量最少的客服' },
  { label: '随机分配', value: 2, desc: '随机分配给在线客服' },
  { label: '固定分配', value: 3, desc: '访客始终由同一客服接待' },
];

const offlineHandlings = [
  { label: '自动回复', value: 0, desc: '发送自动回复消息' },
  { label: '转接其他', value: 1, desc: '转接给其他在线客服' },
  { label: '留言', value: 2, desc: '提示用户留言' },
];

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getConfig();
    if (data) {
      formData.value = {
        id: data.id || 0,
        allocationRule: data.allocationRule ?? 0,
        offlineHandling: data.offlineHandling ?? 2,
        offlineAutoReply: data.offlineAutoReply || '',
        enableWorkTime: data.enableWorkTime ?? false,
        workTimeStart: data.workTimeStart || '09:00',
        workTimeEnd: data.workTimeEnd || '18:00',
        nonWorkTimeMessage: data.nonWorkTimeMessage || '',
        enableQueue: data.enableQueue ?? false,
        maxConcurrentSessions: data.maxConcurrentSessions ?? 50,
        enableBroadcast: data.enableBroadcast ?? false,
      };
    }
  } finally {
    loading.value = false;
  }
});

const handleSave = async () => {
  saving.value = true;
  try {
    const result: any = await saveConfig(formData.value);
    if (result.code === 0) {
      message.success('配置保存成功');
    }
  } finally {
    saving.value = false;
  }
};

const parseTime = (str: string) => {
  if (!str) return undefined;
  return dayjs(str, 'HH:mm');
};

const onTimeChange = (field: 'workTimeStart' | 'workTimeEnd', _time: any, timeString: string) => {
  formData.value[field] = timeString;
};
</script>

<template>
  <Page auto-content-height>
    <Spin :spinning="loading">
      <Row :gutter="16">
        <Col :span="12">
          <Card title="分配规则">
            <Form layout="vertical">
              <FormItem label="客服分配策略">
                <RadioGroup v-model:value="formData.allocationRule">
                  <div
                    v-for="rule in allocationRules"
                    :key="rule.value"
                    style="margin-bottom: 8px;"
                  >
                    <Radio :value="rule.value">
                      <span style="font-weight: 500;">{{ rule.label }}</span>
                      <span style="color: #999; font-size: 12px; margin-left: 8px;">
                        {{ rule.desc }}
                      </span>
                    </Radio>
                  </div>
                </RadioGroup>
              </FormItem>

              <Divider />

              <FormItem label="离线处理方式">
                <RadioGroup v-model:value="formData.offlineHandling">
                  <div
                    v-for="item in offlineHandlings"
                    :key="item.value"
                    style="margin-bottom: 8px;"
                  >
                    <Radio :value="item.value">
                      <span style="font-weight: 500;">{{ item.label }}</span>
                      <span style="color: #999; font-size: 12px; margin-left: 8px;">
                        {{ item.desc }}
                      </span>
                    </Radio>
                  </div>
                </RadioGroup>
              </FormItem>

              <FormItem
                v-if="formData.offlineHandling === 0"
                label="自动回复内容"
              >
                <Input.TextArea
                  v-model:value="formData.offlineAutoReply"
                  placeholder="请输入自动回复内容"
                  :rows="3"
                  :maxlength="500"
                  show-count
                />
              </FormItem>
            </Form>
          </Card>
        </Col>

        <Col :span="12">
          <Card title="工作时间">
            <Form layout="vertical">
              <FormItem label="启用工作时间限制">
                <Switch v-model:checked="formData.enableWorkTime" />
              </FormItem>

              <template v-if="formData.enableWorkTime">
                <FormItem label="工作时间段">
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <TimePicker
                      :value="parseTime(formData.workTimeStart)"
                      format="HH:mm"
                      placeholder="开始时间"
                      @change="(t: any, ts: string) => onTimeChange('workTimeStart', t, ts)"
                    />
                    <span>至</span>
                    <TimePicker
                      :value="parseTime(formData.workTimeEnd)"
                      format="HH:mm"
                      placeholder="结束时间"
                      @change="(t: any, ts: string) => onTimeChange('workTimeEnd', t, ts)"
                    />
                  </div>
                </FormItem>

                <FormItem label="非工作时间提示语">
                  <Input.TextArea
                    v-model:value="formData.nonWorkTimeMessage"
                    placeholder="当前不在工作时间，请留言..."
                    :rows="3"
                    :maxlength="500"
                    show-count
                  />
                </FormItem>
              </template>
            </Form>
          </Card>

          <Card title="广播接待" style="margin-top: 16px;">
            <Form layout="vertical">
              <FormItem label="广播接待模式">
                <Switch v-model:checked="formData.enableBroadcast" />
                <div style="color: #999; font-size: 12px; margin-top: 4px;">
                  开启后，新接入的客户消息将广播给所有在线客服，任意客服均可回复。仅对新接入的访客生效，不影响已有会话。
                </div>
              </FormItem>
            </Form>
          </Card>

          <Card title="排队设置" style="margin-top: 16px;">
            <Form layout="vertical">
              <FormItem label="启用排队功能">
                <Switch v-model:checked="formData.enableQueue" />
                <div style="color: #999; font-size: 12px; margin-top: 4px;">
                  关闭后访客将直接分配客服，无需排队等待
                </div>
              </FormItem>

              <template v-if="formData.enableQueue">
                <FormItem label="最大并发会话数">
                  <InputNumber
                    v-model:value="formData.maxConcurrentSessions"
                    :min="1"
                    :max="9999"
                    style="width: 200px;"
                  />
                  <div style="color: #999; font-size: 12px; margin-top: 4px;">
                    当在线访客数超过此值时，新访客将进入排队
                  </div>
                </FormItem>
              </template>
            </Form>
          </Card>
        </Col>
      </Row>

      <div style="margin-top: 16px; text-align: center;">
        <Button
          type="primary"
          size="large"
          :loading="saving"
          @click="handleSave"
          style="min-width: 200px;"
        >
          保存配置
        </Button>
      </div>
    </Spin>
  </Page>
</template>
