<script setup lang="ts">
import { computed } from 'vue';

import { Card, Descriptions, DescriptionsItem, Tag } from 'ant-design-vue';

import { usePermission } from '#/composables/usePermission';

const { userType, role, dataScope, isAdmin, isOwner, isAgent } =
  usePermission();

const roleLabel = computed(() => {
  if (isAdmin.value) return '系统管理员';
  if (isOwner.value) return '站长';
  if (isAgent.value) return '客服';
  return '未知';
});

const roleColor = computed(() => {
  if (isAdmin.value) return 'red';
  if (isOwner.value) return 'blue';
  if (isAgent.value) return 'green';
  return 'default';
});

const permissionDescription = computed(() => {
  if (isAdmin.value) return '您拥有系统的最高权限，可以管理所有数据和执行系统级操作。';
  if (isOwner.value) return '您可以管理自己的平台和客服团队，配置客服分配规则。';
  if (isAgent.value) return '您可以在工作台接待客户、查看客户信息和处理会话。';
  return '';
});

const dataScopeLabel = computed(() => {
  const labels: Record<string, string> = {
    all: '所有数据',
    owned: '所属范围的数据',
    self: '仅自己的数据',
  };
  return labels[dataScope.value] || '';
});

const permissionFeatures = computed(() => {
  if (isAdmin.value) {
    return ['管理所有管理员', '管理角色', '管理菜单', '系统设置', '查看所有会员'];
  }
  if (isOwner.value) {
    return ['管理我的客服', '管理接入平台', '管理聊天用户', '配置分配规则', '客服工作台'];
  }
  if (isAgent.value) {
    return ['客服工作台', '查看客户信息', '编辑客户备注'];
  }
  return [];
});
</script>

<template>
  <Card title="权限信息">
    <Descriptions :column="1" bordered>
      <DescriptionsItem label="角色类型">
        <Tag :color="roleColor">{{ roleLabel }}</Tag>
      </DescriptionsItem>

      <DescriptionsItem label="数据范围">
        <span class="font-medium">{{ dataScopeLabel }}</span>
      </DescriptionsItem>

      <DescriptionsItem label="权限说明">
        <p class="text-gray-600">{{ permissionDescription }}</p>
      </DescriptionsItem>

      <DescriptionsItem label="主要功能">
        <div class="space-y-1">
          <div
            v-for="(feature, index) in permissionFeatures"
            :key="index"
            class="flex items-center"
          >
            <span class="mr-2 text-green-500">✓</span>
            <span>{{ feature }}</span>
          </div>
        </div>
      </DescriptionsItem>

      <DescriptionsItem label="权限级别">
        <div class="flex items-center space-x-2">
          <div
            class="h-2 flex-1 rounded-full bg-gray-200"
            style="max-width: 200px"
          >
            <div
              class="h-full rounded-full transition-all"
              :class="{
                'bg-red-500': isAdmin,
                'bg-blue-500': isOwner,
                'bg-green-500': isAgent,
              }"
              :style="{
                width: isAdmin ? '100%' : isOwner ? '66%' : '33%',
              }"
            ></div>
          </div>
          <span class="text-sm text-gray-500">
            {{ isAdmin ? '最高' : isOwner ? '中' : '基础' }}
          </span>
        </div>
      </DescriptionsItem>
    </Descriptions>
  </Card>
</template>
