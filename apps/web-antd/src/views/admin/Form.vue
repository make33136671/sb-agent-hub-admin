<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { Card, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';

import { getDetail, postAdd, postEdit, getRoleList } from './api';

const route = useRoute();

const id = ref<number>(0);

onMounted(async () => {
  id.value = Number(route.query.id) || 0;
  if (id.value > 0) {
    const result = await getDetail(id.value);
    baseFormApi.setValues(result);
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
      fieldName: 'roleId',
      component: 'ApiSelect',
      label: '角色',
      rules: 'required',
      componentProps: {
        placeholder: '请选择角色',
        api: getRoleList,
        afterFetch: (data: any) => {
          return data.items.map((item: any) => ({
            label: item.name,
            value: item.id,
          }));
        },
      },
    },
    {
      fieldName: 'name',
      component: 'Input',
      label: '姓名',
      componentProps: { placeholder: '请输入姓名' },
    },
    {
      fieldName: 'status',
      component: 'RadioGroup',
      label: '状态',
      defaultValue: 0,
      componentProps: {
        options: [
          { label: '正常', value: 0, key: '0' },
          { label: '停用', value: 1, key: '1' },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-1 md:grid-cols-2',
});

function onSubmit(values: Record<string, any>) {
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
  <Card :title="id > 0 ? '编辑管理员' : '新增管理员'" style="margin: 10px">
    <BaseForm />
  </Card>
</template>
