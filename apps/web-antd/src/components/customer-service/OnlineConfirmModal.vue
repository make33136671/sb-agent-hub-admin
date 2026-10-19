<script lang="ts" setup>
import { computed, ref, watch } from 'vue';

import { IconifyIcon } from '@vben/icons';
import { useSoundSettingsStore } from '@vben/stores';

import { Button, Modal, Radio, RadioGroup, Switch } from 'ant-design-vue';

defineOptions({
  name: 'OnlineConfirmModal',
});

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
  confirmed: [isOnline: boolean, goToWorkbench: boolean];
}>();

// 默认选中在线
const isOnline = ref(true);

// 使用 soundSettingsStore 双向绑定
const soundSettingsStore = useSoundSettingsStore();

const enableMessageSound = computed({
  get: () => soundSettingsStore.settings.newMessageEnabled,
  set: (val: boolean) => soundSettingsStore.updateSettings({ newMessageEnabled: val }),
});
const enableSystemSound = computed({
  get: () => soundSettingsStore.settings.systemNotificationEnabled,
  set: (val: boolean) => soundSettingsStore.updateSettings({ systemNotificationEnabled: val }),
});

// 监听 open 变化，重置在线状态
watch(
  () => props.open,
  (newVal) => {
    if (newVal) {
      isOnline.value = true;
    }
  },
  { immediate: true },
);

// 确认在线并进入工作台
function handleGoToWorkbench() {
  emit('update:open', false);
  emit('confirmed', isOnline.value, true);
}

// 确认在线并关闭弹窗（后台运行）
function handleConfirmOnline() {
  emit('update:open', false);
  emit('confirmed', isOnline.value, false);
}

// 选择离线 / 暂不接待
function handleOffline() {
  emit('confirmed', false, false);
  emit('update:open', false);
}
</script>

<template>
  <Modal
    :open="props.open"
    :closable="true"
    :maskClosable="false"
    :keyboard="false"
    :footer="null"
    centered
    width="420px"
    class="online-confirm-modal"
    @update:open="emit('update:open', $event)"
  >
    <template #closeIcon>
      <button class="modal-close-btn" @click="handleOffline">
        <IconifyIcon icon="ant-design:close-outlined" class="close-icon" />
      </button>
    </template>
    <div class="modal-content">
      <!-- 顶部标题 -->
      <h3 class="modal-title">客服工作台</h3>

      <!-- Logo 和状态选择区域 -->
      <div class="header-section">
        <!-- 左侧：Logo + 状态点 -->
        <div class="icon-wrapper">
          <div class="icon-bg">
            <IconifyIcon
              icon="ant-design:customer-service-outlined"
              class="main-icon"
            />
          </div>
          <div class="status-dot" :class="{ offline: !isOnline }" />
        </div>

        <!-- 右侧：在线状态选择 -->
        <RadioGroup v-model:value="isOnline" size="large" class="status-radio">
          <Radio :value="true" class="status-option online-option">
            <div class="radio-content">
              <IconifyIcon
                icon="ant-design:check-circle-filled"
                class="radio-icon online"
              />
              <span class="radio-label">在线接待</span>
            </div>
          </Radio>
          <Radio :value="false" class="status-option offline-option">
            <div class="radio-content">
              <IconifyIcon
                icon="ant-design:stop-outlined"
                class="radio-icon offline"
              />
              <span class="radio-label">离线模式</span>
            </div>
          </Radio>
        </RadioGroup>
      </div>

      <!-- 按钮区域 -->
      <div class="button-group">
        <div class="button-row">
          <Button
            type="primary"
            size="large"
            class="primary-btn"
            @click="handleGoToWorkbench"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:desktop-outlined" />
            </template>
            进入工作台
          </Button>

          <Button
            size="large"
            class="secondary-btn"
            @click="handleConfirmOnline"
          >
            <template #icon>
              <IconifyIcon icon="ant-design:check-outlined" />
            </template>
            后台运行
          </Button>
        </div>

        <Button
          type="text"
          size="large"
          block
          class="text-btn"
          @click="handleOffline"
        >
          暂不接待
        </Button>
      </div>

      <!-- 声音设置 -->
      <div class="sound-settings">
        <div class="sound-title">
          <IconifyIcon icon="ant-design:sound-outlined" class="sound-icon" />
          <span>声音提示设置</span>
        </div>
        <div class="sound-options">
          <div class="sound-option">
            <span class="option-label">新消息提示</span>
            <Switch v-model:checked="enableMessageSound" size="default" />
          </div>
          <div class="sound-option">
            <span class="option-label">系统消息提示</span>
            <Switch v-model:checked="enableSystemSound" size="default" />
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tip-area">
        <IconifyIcon
          icon="ant-design:info-circle-outlined"
          class="tip-icon"
        />
        <span>声音设置将在点击后生效</span>
      </div>
    </div>
  </Modal>
</template>

<style scoped>
.modal-content {
  display: flex;
  flex-direction: column;
  padding: 20px 16px 16px;
}

.modal-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
}

.header-section {
  display: flex;
  gap: 12px;
  width: 100%;
  margin-bottom: 20px;
}

.icon-wrapper {
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
}

.icon-bg {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
}

.main-icon {
  font-size: 40px;
  color: #fff;
}

.status-dot {
  position: absolute;
  right: calc(50% - 40px - 4px);
  bottom: calc(50% - 40px - 4px);
  width: 24px;
  height: 24px;
  background: #52c41a;
  border: 4px solid #fff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.4);
}

.status-dot.offline {
  background: #d1d5db;
  box-shadow: 0 2px 8px rgba(209, 213, 219, 0.4);
}

.status-radio {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  justify-content: center;
}

.status-option {
  width: 100%;
  margin: 0 !important;
}

.status-option :deep(.ant-radio) {
  display: none;
}

.radio-content {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  padding: 12px 16px;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.04);
  border: 2px solid transparent;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.status-option :deep(.ant-radio-wrapper-checked) .radio-content {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.online-option :deep(.ant-radio-wrapper-checked) .radio-content {
  background: rgba(82, 196, 26, 0.1);
  border-color: #52c41a;
}

.offline-option :deep(.ant-radio-wrapper-checked) .radio-content {
  background: rgba(107, 114, 128, 0.1);
  border-color: #6b7280;
}

.radio-icon {
  font-size: 18px;
  transition: all 0.3s ease;
}

.radio-icon.online {
  color: #52c41a;
}

.radio-icon.offline {
  color: #6b7280;
}

.radio-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  transition: all 0.3s ease;
}

.status-option :deep(.ant-radio-wrapper-checked) .radio-label {
  font-weight: 600;
  color: #1f2937;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.button-row {
  display: flex;
  gap: 12px;
  width: 100%;
}

.primary-btn {
  flex: 1;
  height: 48px;
  font-size: 14px;
  font-weight: 500;
  color: #fff !important;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}

.primary-btn:hover {
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
  transform: translateY(-2px);
}

.secondary-btn {
  flex: 1;
  height: 48px;
  font-size: 14px;
  color: #667eea !important;
  background: rgba(102, 126, 234, 0.1) !important;
  border: 1px solid rgba(102, 126, 234, 0.3) !important;
  border-radius: 10px;
  transition: all 0.3s ease;
}

.secondary-btn:hover {
  color: #764ba2 !important;
  background: rgba(102, 126, 234, 0.2) !important;
  border-color: rgba(102, 126, 234, 0.4) !important;
}

.text-btn {
  height: 40px;
  font-size: 14px;
  color: #9ca3af !important;
}

.text-btn:hover {
  color: #6b7280 !important;
  background: rgba(0, 0, 0, 0.04) !important;
}

.sound-settings {
  width: 100%;
  margin-top: 20px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 10px;
}

.sound-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.sound-icon {
  font-size: 16px;
  color: #667eea;
}

.sound-options {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.sound-option {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 14px 12px;
  background: #fff;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.sound-option:hover {
  background: rgba(102, 126, 234, 0.05);
}

.option-label {
  font-size: 13px;
  font-weight: 500;
  color: #4b5563;
  text-align: center;
}

.tip-area {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 20px;
  padding: 10px 16px;
  font-size: 13px;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 8px;
}

.tip-icon {
  font-size: 16px;
  color: #3b82f6;
}

/* 关闭按钮样式 - 圆形，最右上角 */
.modal-close-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.08);
  border: none;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.modal-close-btn:hover {
  background: rgba(0, 0, 0, 0.12);
  transform: scale(1.05);
}

.modal-close-btn:active {
  transform: scale(0.95);
}

.close-icon {
  font-size: 24px;
  color: #374151;
  transition: all 0.3s ease;
}

.modal-close-btn:hover .close-icon {
  color: #1f2937;
}
</style>

<style>
/* 全局样式覆盖 Modal */
.online-confirm-modal .ant-modal-content {
  overflow: hidden;
  border-radius: 12px;
}

.online-confirm-modal .ant-modal-body {
  padding: 0;
  overflow: hidden;
}

/* 暗黑模式适配 */
html.dark .online-confirm-modal .modal-title,
.dark .online-confirm-modal .modal-title {
  color: #f3f4f6 !important;
}

html.dark .online-confirm-modal .status-dot,
.dark .online-confirm-modal .status-dot {
  border-color: #374151 !important;
}

html.dark .online-confirm-modal .status-dot.offline,
.dark .online-confirm-modal .status-dot.offline {
  background: #6b7280 !important;
  box-shadow: 0 2px 8px rgba(107, 114, 128, 0.4) !important;
}

html.dark .online-confirm-modal .radio-content,
.dark .online-confirm-modal .radio-content {
  background: rgba(255, 255, 255, 0.06) !important;
}

html.dark
  .online-confirm-modal
  .status-option
  .ant-radio-wrapper-checked
  .radio-content,
.dark
  .online-confirm-modal
  .status-option
  .ant-radio-wrapper-checked
  .radio-content {
  background: rgba(102, 126, 234, 0.2) !important;
}

html.dark
  .online-confirm-modal
  .online-option
  .ant-radio-wrapper-checked
  .radio-content,
.dark
  .online-confirm-modal
  .online-option
  .ant-radio-wrapper-checked
  .radio-content {
  background: rgba(82, 196, 26, 0.2) !important;
}

html.dark
  .online-confirm-modal
  .offline-option
  .ant-radio-wrapper-checked
  .radio-content,
.dark
  .online-confirm-modal
  .offline-option
  .ant-radio-wrapper-checked
  .radio-content {
  background: rgba(107, 114, 128, 0.2) !important;
}

html.dark .online-confirm-modal .radio-label,
.dark .online-confirm-modal .radio-label {
  color: #d1d5db !important;
}

html.dark
  .online-confirm-modal
  .status-option
  .ant-radio-wrapper-checked
  .radio-label,
.dark
  .online-confirm-modal
  .status-option
  .ant-radio-wrapper-checked
  .radio-label {
  color: #f3f4f6 !important;
}

html.dark .online-confirm-modal .secondary-btn,
.dark .online-confirm-modal .secondary-btn {
  color: #a5b4fc !important;
  background: rgba(102, 126, 234, 0.2) !important;
  border-color: rgba(102, 126, 234, 0.4) !important;
}

html.dark .online-confirm-modal .secondary-btn:hover,
.dark .online-confirm-modal .secondary-btn:hover {
  color: #c4b5fd !important;
  background: rgba(102, 126, 234, 0.3) !important;
}

html.dark .online-confirm-modal .text-btn,
.dark .online-confirm-modal .text-btn {
  color: #9ca3af !important;
}

html.dark .online-confirm-modal .text-btn:hover,
.dark .online-confirm-modal .text-btn:hover {
  color: #d1d5db !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

html.dark .online-confirm-modal .sound-settings,
.dark .online-confirm-modal .sound-settings {
  background: rgba(255, 255, 255, 0.04) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

html.dark .online-confirm-modal .sound-title,
.dark .online-confirm-modal .sound-title {
  color: #f3f4f6 !important;
}

html.dark .online-confirm-modal .sound-option,
.dark .online-confirm-modal .sound-option {
  background: rgba(255, 255, 255, 0.06) !important;
}

html.dark .online-confirm-modal .sound-option:hover,
.dark .online-confirm-modal .sound-option:hover {
  background: rgba(102, 126, 234, 0.15) !important;
}

html.dark .online-confirm-modal .option-label,
.dark .online-confirm-modal .option-label {
  color: #d1d5db !important;
}

html.dark .online-confirm-modal .tip-area,
.dark .online-confirm-modal .tip-area {
  color: #9ca3af !important;
  background: rgba(255, 255, 255, 0.06) !important;
}

/* 暗黑模式 - 关闭按钮 */
html.dark .modal-close-btn,
.dark .modal-close-btn {
  background: rgba(255, 255, 255, 0.08) !important;
}

html.dark .modal-close-btn:hover,
.dark .modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.12) !important;
}

html.dark .close-icon,
.dark .close-icon {
  color: #9ca3af !important;
}

html.dark .modal-close-btn:hover .close-icon,
.dark .modal-close-btn:hover .close-icon {
  color: #d1d5db !important;
}
</style>
