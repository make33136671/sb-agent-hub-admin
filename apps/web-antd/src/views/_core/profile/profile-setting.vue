<script setup lang="ts">
import { onMounted, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { Button, Card, Form, FormItem, Input, message, Spin } from 'ant-design-vue';

import { getUserInfoApi } from '#/api/core/user';
import { updateProfileApi } from '#/api/core/admin';

const userStore = useUserStore();
const loading = ref(false);
const submitting = ref(false);

const formData = ref({
  username: '',
  roleName: '',
  name: '',
});

onMounted(async () => {
  loading.value = true;
  try {
    const data = await getUserInfoApi();
    const roleMap: Record<string, string> = { Owner: '站长', Agent: '客服' };
    formData.value = {
      username: data.username || '',
      roleName: (data as any).roleName || roleMap[(data as any).role] || (data.roles?.[0] ?? ''),
      name: data.realName || '',
    };
  } finally {
    loading.value = false;
  }
});

async function handleSubmit() {
  submitting.value = true;
  try {
    await updateProfileApi({ name: formData.value.name });
    userStore.setUserInfo({
      ...userStore.userInfo,
      realName: formData.value.name,
    });
    message.success('资料修改成功');
  } catch {
    // requestClient 会自动处理错误消息
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="flex w-full justify-center">
    <Card title="修改资料" class="w-full max-w-md">
      <Spin :spinning="loading">
        <Form layout="vertical">
          <FormItem label="用户名">
            <Input :value="formData.username" disabled />
          </FormItem>
          <FormItem label="角色">
            <Input :value="formData.roleName" disabled />
          </FormItem>
          <FormItem label="姓名">
            <Input
              v-model:value="formData.name"
              placeholder="请输入姓名"
              :maxlength="50"
              allow-clear
            />
          </FormItem>
          <FormItem>
            <Button
              type="primary"
              :loading="submitting"
              block
              @click="handleSubmit"
            >
              保存修改
            </Button>
          </FormItem>
        </Form>
      </Spin>
    </Card>
  </div>
</template>
