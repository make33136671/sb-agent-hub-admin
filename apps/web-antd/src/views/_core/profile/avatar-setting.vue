<script setup lang="ts">
import { computed, ref } from 'vue';

import { useUserStore } from '@vben/stores';

import { Card, Button, Upload, message, Spin } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';

import { changeAvatarApi, uploadFileApi } from '#/api/core/admin';

const userStore = useUserStore();

// 当前用户头像
const currentAvatar = computed(() => userStore.userInfo?.avatar || '');
// 新上传的头像（用于预览）
const newAvatarUrl = ref('');
// 显示的头像：优先显示新上传的，否则显示当前头像
const displayAvatar = computed(() => newAvatarUrl.value || currentAvatar.value);
const uploading = ref(false);

async function customUpload(options: UploadRequestOption) {
  const { file, onSuccess, onError } = options;

  try {
    uploading.value = true;
    const result = await uploadFileApi(file as File);
    if (result) {
      // result 可能是对象或字符串
      const url =
        typeof result === 'string'
          ? result
          : (result as any).fileName || (result as any).absfileName;
      newAvatarUrl.value = url;
      message.success('图片上传成功');
      onSuccess?.(result);
    } else {
      message.error('图片上传失败');
      onError?.(new Error('上传失败'));
    }
  } catch (error) {
    message.error('图片上传失败');
    onError?.(error as Error);
  } finally {
    uploading.value = false;
  }
}

async function handleSave() {
  if (!newAvatarUrl.value) {
    message.error('请先上传头像');
    return;
  }

  try {
    const res = await changeAvatarApi(newAvatarUrl.value);
    // sbRequestClient 会自动显示成功/失败消息
    if (res?.code === 0) {
      // 更新用户信息
      userStore.setUserInfo({
        ...userStore.userInfo,
        avatar: newAvatarUrl.value,
      });
    }
  } catch {
    // sbRequestClient 会自动处理错误消息
  }
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error('只能上传图片文件');
    return false;
  }
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB');
    return false;
  }
  return true;
}
</script>

<template>
  <div class="flex justify-center w-full">
    <Card title="修改头像" class="w-full max-w-md">
      <div class="flex flex-col items-center gap-6">
      <Spin :spinning="uploading">
        <div class="relative">
          <div
            class="h-32 w-32 overflow-hidden rounded-full border-4 border-gray-200"
          >
            <img
              v-if="displayAvatar"
              :src="displayAvatar"
              alt="头像"
              class="h-full w-full object-cover"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400"
            >
              暂无头像
            </div>
          </div>
        </div>
      </Spin>

      <Upload
        :show-upload-list="false"
        :before-upload="beforeUpload"
        :custom-request="customUpload"
        accept="image/*"
      >
        <Button type="primary" :loading="uploading">
          {{ uploading ? '上传中...' : '选择图片' }}
        </Button>
      </Upload>

      <div class="text-sm text-gray-500">
        支持 JPG、PNG 格式，大小不超过 2MB
      </div>

      <Button
        type="primary"
        :disabled="!newAvatarUrl || newAvatarUrl === userStore.userInfo?.avatar"
        @click="handleSave"
      >
        保存头像
      </Button>
      </div>
    </Card>
  </div>
</template>
