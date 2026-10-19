<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Card, message, Upload, Button, Spin } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';

import { useVbenForm } from '#/adapter/form';
import { uploadFileApi } from '#/api/core/admin';

import { getDetail, postAdd, postEdit } from './api';

const router = useRouter();
const route = useRoute();

const id = ref<number>(0);
const avatarUrl = ref('');
const uploading = ref(false);

onMounted(async () => {
  id.value = Number(route.query.id) || 0;
  if (id.value > 0) {
    const result = await getDetail(id.value);
    baseFormApi.setValues(result);
    avatarUrl.value = result.avatar || '';
  }
});

const [BaseForm, baseFormApi] = useVbenForm({
  commonConfig: {
    colon: true,
    componentProps: { class: 'w-full' },
  },
  handleSubmit: onSubmit,
  layout: 'horizontal',
  schema: [
    {
      fieldName: 'username',
      component: 'Input',
      label: '用户名',
      rules: 'required',
      componentProps: { placeholder: '请输入用户名' },
    },
    {
      fieldName: 'password',
      component: 'Input',
      label: '密码',
      componentProps: { placeholder: '请输入密码', type: 'password' },
      dependencies: {
        triggerFields: [],
        if: () => id.value === 0,
      },
    },
    {
      fieldName: 'name',
      component: 'Input',
      label: '姓名',
      componentProps: { placeholder: '请输入姓名' },
    },
    {
      fieldName: 'agentNo',
      component: 'Input',
      label: '工号',
      componentProps: { placeholder: '请输入工号（可选）' },
    },
    {
      fieldName: 'role',
      component: 'RadioGroup',
      label: '角色',
      defaultValue: 0,
      rules: 'required',
      componentProps: {
        options: [
          { label: '站长 (Owner)', value: 0, key: '0' },
          { label: '客服 (Agent)', value: 1, key: '1' },
        ],
      },
    },
    {
      fieldName: 'ownerId',
      component: 'OwnerSelect',
      label: '所属站长',
      rules: 'required',
      componentProps: { placeholder: '选择站长' },
      dependencies: {
        triggerFields: ['role'],
        if(values) {
          return values.role === 1;
        },
      },
    },
    {
      fieldName: 'maxConcurrent',
      component: 'InputNumber',
      label: '最大接待量',
      defaultValue: 10,
      componentProps: { placeholder: '同时接待访客上限', min: 1, max: 100 },
    },
    {
      fieldName: 'welcomeMessage',
      component: 'Textarea',
      label: '欢迎语',
      componentProps: { placeholder: '访客接入时自动发送的欢迎语', rows: 3 },
    },
    {
      fieldName: 'status',
      component: 'RadioGroup',
      label: '账户状态',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '正常', value: 0, key: '0' },
          { label: '封禁', value: 1, key: '1' },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

async function customUpload(options: UploadRequestOption) {
  const { file, onSuccess, onError } = options;
  try {
    uploading.value = true;
    const result = await uploadFileApi(file as File);
    if (result) {
      const url =
        typeof result === 'string'
          ? result
          : (result as any).fileName || (result as any).absfileName;
      avatarUrl.value = url;
      message.success('头像上传成功');
      onSuccess?.(result);
    } else {
      message.error('上传失败');
      onError?.(new Error('上传失败'));
    }
  } catch (error) {
    message.error('上传失败');
    onError?.(error as Error);
  } finally {
    uploading.value = false;
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

function onSubmit(values: Record<string, any>) {
  values.avatar = avatarUrl.value;
  if (id.value > 0) {
    values.id = id.value;
    postEdit(values).then((result: any) => {
      if (result.code === 0) {
        message.success('保存成功');
      }
    });
  } else {
    postAdd(values).then((result: any) => {
      if (result.code === 0) {
        id.value = result.data?.id;
        message.success('创建成功');
      }
    });
  }
}
</script>

<template>
  <Card :title="id > 0 ? '编辑成员' : '新增成员'" style="margin: 10px">
    <div class="mb-4 flex items-center gap-4" style="padding-left: 68px;">
      <span class="shrink-0" style="width: 80px; text-align: right;">头像：</span>
      <div class="flex items-center gap-4">
        <Spin :spinning="uploading">
          <div class="h-16 w-16 overflow-hidden rounded-full border-2 border-gray-200">
            <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="h-full w-full object-cover" />
            <div v-else class="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400 text-xs">
              暂无
            </div>
          </div>
        </Spin>
        <Upload
          :show-upload-list="false"
          :before-upload="beforeUpload"
          :custom-request="customUpload"
          accept="image/*"
        >
          <Button size="small" :loading="uploading">
            {{ uploading ? '上传中...' : '选择图片' }}
          </Button>
        </Upload>
      </div>
    </div>
    <BaseForm />
  </Card>
</template>
