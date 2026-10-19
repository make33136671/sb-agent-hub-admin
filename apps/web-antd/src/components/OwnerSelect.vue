<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Select } from 'ant-design-vue';

import { getOwnerOptions } from '#/views/member/api';

const props = defineProps<{
  value?: null | number;
  disabled?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<{
  'update:value': [value: number | undefined];
  change: [value: number | undefined];
}>();

const options = ref<{ label: string; value: number }[]>([]);
const loading = ref(false);

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getOwnerOptions();
    options.value = (res || []).map((o: any) => ({
      label: o.name || o.username,
      value: o.id,
    }));
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <Select
    :value="value"
    :options="options"
    :loading="loading"
    :disabled="disabled"
    :placeholder="placeholder || '请选择站长'"
    @update:value="emit('update:value', $event)"
    @change="emit('change', $event)"
  />
</template>
