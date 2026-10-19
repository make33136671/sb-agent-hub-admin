<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import {
  AutoComplete,
  Checkbox,
  DatePicker,
  Input,
  InputNumber,
  InputPassword,
  Mentions,
  Modal,
  Radio,
  Rate,
  Select,
  Switch,
  TimePicker,
  TreeSelect,
  Upload,
  Button,
  message,
} from 'ant-design-vue';
import { IconifyIcon } from '@vben/icons';
import type { UploadFile, UploadChangeParam } from 'ant-design-vue';
import type { UploadRequestOption } from 'ant-design-vue/es/vc-upload/interface';

import { IconPicker } from '@vben/common-ui';
import { uploadFileApi } from '#/api/core/admin';

const Textarea = Input.TextArea;
const RadioGroup = Radio.Group;
const CheckboxGroup = Checkbox.Group;
const RangePicker = DatePicker.RangePicker;

interface SettingItem {
  id: number;
  key: string;
  name: string;
  displayType: number;
  dataContent: string | null;
  dataContentConfig: string;
  cantDelete: boolean;
  sort: number;
}

const props = defineProps<{
  setting: SettingItem;
  modelValue: any;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

const localValue = computed({
  get: () => props.modelValue,
  set: (val: any) => emit('update:modelValue', val),
});

// Parse dataContentConfig as JSON
const config = computed(() => {
  try {
    if (props.setting.dataContentConfig) {
      return JSON.parse(props.setting.dataContentConfig);
    }
  } catch {
    // ignore
  }
  return null;
});

// For options-based components (RadioGroup, Select, CheckboxGroup, AutoComplete, Mentions)
const options = computed(() => {
  if (Array.isArray(config.value)) {
    return config.value;
  }
  return [];
});

// Switch: convert between "true"/"false" and boolean
const switchValue = computed({
  get: () => localValue.value === 'true' || localValue.value === true,
  set: (val: boolean) => {
    localValue.value = val ? 'true' : 'false';
  },
});

// CheckboxGroup: convert between JSON string and array
const checkboxValue = computed({
  get: () => {
    try {
      if (typeof localValue.value === 'string' && localValue.value) {
        return JSON.parse(localValue.value);
      }
    } catch {
      // ignore
    }
    return Array.isArray(localValue.value) ? localValue.value : [];
  },
  set: (val: any[]) => {
    localValue.value = JSON.stringify(val);
  },
});

// RangePicker: convert between JSON string and array
const rangeValue = computed({
  get: () => {
    try {
      if (typeof localValue.value === 'string' && localValue.value) {
        return JSON.parse(localValue.value);
      }
    } catch {
      // ignore
    }
    return Array.isArray(localValue.value) ? localValue.value : [];
  },
  set: (val: any) => {
    localValue.value = val ? JSON.stringify(val) : '';
  },
});

// === Upload helpers ===

// Single image upload fileList
const imageFileList = ref<UploadFile[]>([]);
// Multi image upload fileList
const multiImageFileList = ref<UploadFile[]>([]);
// File upload fileList
const fileUploadList = ref<UploadFile[]>([]);

// Initialize upload fileLists from modelValue
function initImageFileList() {
  const val = props.modelValue;
  if (val && typeof val === 'string' && val.trim()) {
    imageFileList.value = [
      {
        uid: '-1',
        name: val.split('/').pop() || 'image',
        status: 'done',
        url: val,
      },
    ];
  } else {
    imageFileList.value = [];
  }
}

function initMultiImageFileList() {
  const val = props.modelValue;
  try {
    const arr =
      typeof val === 'string' && val.trim() ? JSON.parse(val) : val;
    if (Array.isArray(arr)) {
      multiImageFileList.value = arr.map((url: string, i: number) => ({
        uid: `${-i - 1}`,
        name: url.split('/').pop() || `image-${i}`,
        status: 'done' as const,
        url,
      }));
    } else {
      multiImageFileList.value = [];
    }
  } catch {
    multiImageFileList.value = [];
  }
}

function initFileUploadList() {
  const val = props.modelValue;
  try {
    const arr =
      typeof val === 'string' && val.trim() ? JSON.parse(val) : val;
    if (Array.isArray(arr)) {
      fileUploadList.value = arr.map((url: string, i: number) => ({
        uid: `${-i - 1}`,
        name: url.split('/').pop() || `file-${i}`,
        status: 'done' as const,
        url,
      }));
    } else {
      fileUploadList.value = [];
    }
  } catch {
    fileUploadList.value = [];
  }
}

// Watch modelValue to re-init file lists when data changes externally
watch(
  () => props.modelValue,
  () => {
    if (props.setting.displayType === 6) initImageFileList();
    if (props.setting.displayType === 17) initMultiImageFileList();
    if (props.setting.displayType === 18) initFileUploadList();
  },
  { immediate: true },
);

// Custom upload handler
async function handleCustomUpload(options: UploadRequestOption) {
  const { file, onSuccess, onError } = options;
  try {
    const result = await uploadFileApi(file as File);
    if (result) {
      const url =
        typeof result === 'string'
          ? result
          : (result as any).absfileName || (result as any).fileName;
      onSuccess?.({ url });
    } else {
      message.error('上传失败');
      onError?.(new Error('上传失败'));
    }
  } catch (error) {
    message.error('上传失败');
    onError?.(error as Error);
  }
}

// Single image upload change
function handleImageChange(info: UploadChangeParam) {
  imageFileList.value = info.fileList;
  if (info.file.status === 'done') {
    const url = info.file.response?.url;
    if (url) {
      localValue.value = url;
    }
  }
  if (info.fileList.length === 0) {
    localValue.value = '';
  }
}

// Multi image upload change
function handleMultiImageChange(info: UploadChangeParam) {
  multiImageFileList.value = info.fileList;
  // Only update modelValue when all files are done
  const allDone = info.fileList.every(
    (f) => f.status === 'done' || f.url,
  );
  if (allDone || info.file.status === 'removed') {
    const urls = info.fileList
      .map((f) => f.url || f.response?.url)
      .filter(Boolean);
    localValue.value = JSON.stringify(urls);
  }
}

// File upload change
function handleFileChange(info: UploadChangeParam) {
  fileUploadList.value = info.fileList;
  const allDone = info.fileList.every(
    (f) => f.status === 'done' || f.url,
  );
  if (allDone || info.file.status === 'removed') {
    const urls = info.fileList
      .map((f) => f.url || f.response?.url)
      .filter(Boolean);
    localValue.value = JSON.stringify(urls);
  }
}

// Image preview
const previewVisible = ref(false);
const previewImage = ref('');

function handlePreview(file: UploadFile) {
  previewImage.value = file.url || file.response?.url || '';
  previewVisible.value = true;
}

// Max count from config
const maxCount = computed(() => config.value?.maxCount || 9);
const acceptTypes = computed(() => config.value?.accept || '');
</script>

<template>
  <!-- Input (0) -->
  <Input
    v-if="setting.displayType === 0"
    v-model:value="localValue"
    :placeholder="config?.placeholder || `请输入${setting.name}`"
    allow-clear
  />

  <!-- InputTextArea (1) -->
  <Textarea
    v-else-if="setting.displayType === 1"
    v-model:value="localValue"
    :placeholder="config?.placeholder || `请输入${setting.name}`"
    :rows="4"
    allow-clear
  />

  <!-- RadioGroup (2) -->
  <RadioGroup
    v-else-if="setting.displayType === 2"
    v-model:value="localValue"
    :options="options"
  />

  <!-- Select (3) -->
  <Select
    v-else-if="setting.displayType === 3"
    v-model:value="localValue"
    :options="options"
    :placeholder="`请选择${setting.name}`"
    allow-clear
    style="width: 100%"
  />

  <!-- CheckboxGroup (4) -->
  <CheckboxGroup
    v-else-if="setting.displayType === 4"
    v-model:value="checkboxValue"
    :options="options"
  />

  <!-- Switch (5) -->
  <Switch
    v-else-if="setting.displayType === 5"
    v-model:checked="switchValue"
  />

  <!-- ImageUpload (6) -->
  <div v-else-if="setting.displayType === 6">
    <Upload
      :file-list="imageFileList"
      list-type="picture-card"
      :max-count="1"
      :custom-request="handleCustomUpload"
      accept="image/*"
      @change="handleImageChange"
      @preview="handlePreview"
    >
      <div v-if="imageFileList.length < 1">
        <IconifyIcon icon="ant-design:plus-outlined" />
        <div style="margin-top: 8px">上传</div>
      </div>
    </Upload>
    <Modal
      :open="previewVisible"
      :footer="null"
      @cancel="previewVisible = false"
    >
      <img :src="previewImage" alt="preview" style="width: 100%" />
    </Modal>
  </div>

  <!-- InputNumber (7) -->
  <InputNumber
    v-else-if="setting.displayType === 7"
    v-model:value="localValue"
    :min="config?.min"
    :max="config?.max"
    :step="config?.step"
    :placeholder="`请输入${setting.name}`"
    style="width: 100%"
  />

  <!-- InputPassword (8) -->
  <InputPassword
    v-else-if="setting.displayType === 8"
    v-model:value="localValue"
    :placeholder="config?.placeholder || `请输入${setting.name}`"
    allow-clear
  />

  <!-- DatePicker (9) -->
  <DatePicker
    v-else-if="setting.displayType === 9"
    v-model:value="localValue"
    :format="config?.format"
    style="width: 100%"
  />

  <!-- TimePicker (10) -->
  <TimePicker
    v-else-if="setting.displayType === 10"
    v-model:value="localValue"
    :format="config?.format"
    style="width: 100%"
  />

  <!-- RangePicker (11) -->
  <RangePicker
    v-else-if="setting.displayType === 11"
    v-model:value="rangeValue"
    :format="config?.format"
    style="width: 100%"
  />

  <!-- Rate (12) -->
  <Rate
    v-else-if="setting.displayType === 12"
    v-model:value="localValue"
    :count="config?.count || 5"
    :allow-half="config?.allowHalf || false"
  />

  <!-- AutoComplete (13) -->
  <AutoComplete
    v-else-if="setting.displayType === 13"
    v-model:value="localValue"
    :options="options"
    :placeholder="`请输入${setting.name}`"
    style="width: 100%"
  />

  <!-- Mentions (14) -->
  <Mentions
    v-else-if="setting.displayType === 14"
    v-model:value="localValue"
    :options="options"
    :placeholder="`请输入${setting.name}`"
  />

  <!-- TreeSelect (15) -->
  <TreeSelect
    v-else-if="setting.displayType === 15"
    v-model:value="localValue"
    :tree-data="config"
    :placeholder="`请选择${setting.name}`"
    allow-clear
    style="width: 100%"
  />

  <!-- IconPicker (16) -->
  <IconPicker
    v-else-if="setting.displayType === 16"
    v-model:value="localValue"
    :placeholder="`请选择${setting.name}`"
    :input-component="Input"
    icon-slot="addonAfter"
    model-value-prop="value"
  />

  <!-- MultiImageUpload (17) -->
  <div v-else-if="setting.displayType === 17">
    <Upload
      :file-list="multiImageFileList"
      list-type="picture-card"
      :multiple="true"
      :custom-request="handleCustomUpload"
      accept="image/*"
      @change="handleMultiImageChange"
      @preview="handlePreview"
    >
      <div v-if="multiImageFileList.length < maxCount">
        <IconifyIcon icon="ant-design:plus-outlined" />
        <div style="margin-top: 8px">上传</div>
      </div>
    </Upload>
    <Modal
      :open="previewVisible"
      :footer="null"
      @cancel="previewVisible = false"
    >
      <img :src="previewImage" alt="preview" style="width: 100%" />
    </Modal>
  </div>

  <!-- FileUpload (18) -->
  <Upload
    v-else-if="setting.displayType === 18"
    :file-list="fileUploadList"
    :multiple="true"
    :custom-request="handleCustomUpload"
    :accept="acceptTypes"
    @change="handleFileChange"
  >
    <Button>
      <IconifyIcon icon="ant-design:upload-outlined" class="mr-1" />
      上传文件
    </Button>
  </Upload>

  <!-- Fallback -->
  <Input
    v-else
    v-model:value="localValue"
    :placeholder="`请输入${setting.name}`"
    allow-clear
  />
</template>
