<script lang="ts" setup>
import type { NotificationItem } from '@vben/layouts';

import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import {
  BasicLayout,
  LockScreen,
  Notification,
  UserDropdown,
} from '@vben/layouts';
import { preferences } from '@vben/preferences';
import { IconifyIcon } from '@vben/icons';
import { useAccessStore, useSoundSettingsStore, useUserStore } from '@vben/stores';

import { Badge, Tooltip } from 'ant-design-vue';

import OnlineConfirmModal from '#/components/customer-service/OnlineConfirmModal.vue';
import { $t } from '#/locales';
import { useAuthStore } from '#/store';
import '#/store/sound-settings';
import { requestPermission as requestAudioPermission } from '#/utils/notification-sound';
import { customerServiceSession } from '#/utils/customer-service-session';
import { postUpdateStatus } from '#/views/workbench/api';
import { useWorkbenchStore } from '#/views/workbench/store';
import LoginForm from '#/views/_core/authentication/login.vue';

const notifications = ref<NotificationItem[]>([
  {
    id: 1,
    avatar: 'https://avatar.vercel.sh/vercel.svg?text=VB',
    date: '3小时前',
    isRead: true,
    message: '描述信息描述信息描述信息',
    title: '收到了 14 份新周报',
  },
  {
    id: 2,
    avatar: 'https://avatar.vercel.sh/1',
    date: '刚刚',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '朱偏右 回复了你',
  },
  {
    id: 3,
    avatar: 'https://avatar.vercel.sh/1',
    date: '2024-01-01',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '曲丽丽 评论了你',
  },
  {
    id: 4,
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '代办提醒',
  },
  {
    id: 5,
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '跳转Workspace示例',
    link: '/workspace',
  },
  {
    id: 6,
    avatar: 'https://avatar.vercel.sh/satori',
    date: '1天前',
    isRead: false,
    message: '描述信息描述信息描述信息',
    title: '跳转外部链接示例',
    link: 'https://doc.vben.pro',
  },
]);

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const showDot = computed(() =>
  notifications.value.some((item) => !item.isRead),
);

// 客服上线确认弹窗
const showOnlineConfirmModal = ref(false);
const hasCheckedOnlineConfirm = ref(false);

// 声音设置 Store
const soundSettingsStore = useSoundSettingsStore();

// workbench store (用于 Layout 层 IM 连接)
const workbenchStore = useWorkbenchStore();

// 监听用户登录状态，仅 Member 用户且 session 未确认时显示弹窗
watch(
  () => userStore.userInfo,
  async (newUserInfo) => {
    if (newUserInfo && !hasCheckedOnlineConfirm.value) {
      hasCheckedOnlineConfirm.value = true;

      // 初始化声音设置
      soundSettingsStore.initialize();

      const roles = newUserInfo.roles ?? [];
      const isAdmin = roles.includes('admin');

      if (isAdmin) {
        // Admin 用户：直接从后端获取状态，如果在线则自动建立 IM 连接
        try {
          await workbenchStore.loadMyStatus();
          const backendOnline = workbenchStore.backendStatus.onlineStatus;
          if (backendOnline >= 1) {
            workbenchStore.goOnline(backendOnline);
          }
        } catch {
          // ignore
        }
      } else {
        if (!customerServiceSession.isConfirmed()) {
          // 未确认时弹窗
          setTimeout(() => {
            showOnlineConfirmModal.value = true;
          }, 300);
        } else if (customerServiceSession.getOnlineStatus()) {
          // 已确认且标记在线 → 在 Layout 层建立 IM 连接
          try {
            await workbenchStore.loadMyStatus();
            const backendOnline = workbenchStore.backendStatus.onlineStatus;
            if (backendOnline >= 1) {
              workbenchStore.goOnline(backendOnline);
            }
          } catch {
            // ignore
          }
        }
      }
    }
  },
  { immediate: true },
);

async function handleOnlineConfirmed(
  isOnline: boolean,
  goToWorkbench: boolean = false,
) {
  // 在用户交互上下文中请求音频权限
  await requestAudioPermission();
  customerServiceSession.setConfirmed(isOnline);

  if (isOnline) {
    // 在 Layout 层建立 IM 连接（所有页面共享）
    try {
      await workbenchStore.goOnline(1);
    } catch {
      // ignore — 上线失败不阻塞导航
    }
  } else {
    // 通知后端离线
    try {
      await postUpdateStatus(0);
    } catch {
      // ignore
    }
  }

  if (goToWorkbench) {
    router.push('/workbench/index');
  }
}

// 客服工作台入口
function goToWorkbench() {
  router.push('/workbench/index');
}

// 是否为 Member 用户（非 Admin 才显示客服图标）
const isMember = computed(() => {
  const roles = userStore.userInfo?.roles ?? [];
  return !roles.includes('admin');
});

const menus = computed(() => [
  {
    handler: () => {
      router.push({ name: 'Profile' });
    },
    icon: 'lucide:user',
    text: $t('page.auth.profile'),
  },
]);

const avatar = computed(() => {
  return userStore.userInfo?.avatar ?? preferences.app.defaultAvatar;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleNoticeClear() {
  notifications.value = [];
}

function markRead(id: number | string) {
  const item = notifications.value.find((item) => item.id === id);
  if (item) {
    item.isRead = true;
  }
}

function remove(id: number | string) {
  notifications.value = notifications.value.filter((item) => item.id !== id);
}

function handleMakeAll() {
  notifications.value.forEach((item) => (item.isRead = true));
}
watch(
  () => ({
    enable: preferences.app.watermark,
    content: preferences.app.watermarkContent,
  }),
  async ({ enable, content }) => {
    if (enable) {
      await updateWatermark({
        content:
          content ||
          `${userStore.userInfo?.username} - ${userStore.userInfo?.realName}`,
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout @clear-preferences-and-logout="handleLogout">
    <template #user-dropdown>
      <UserDropdown
        :avatar="avatar"
        :menus
        :text="userStore.userInfo?.realName"
        :description="userStore.userInfo?.username"
        :tag-text="(userStore.userInfo as any)?.roleName || ''"
        @logout="handleLogout"
        @profile="router.push({ name: 'Profile' })"
      />
    </template>
    <template #notification>
      <!-- 客服工作台入口 -->
      <Tooltip title="客服工作台">
        <div class="chat-notification" @click="goToWorkbench">
          <Badge :count="workbenchStore.totalUnreadCount" :offset="[4, -4]" size="small">
            <div class="chat-icon-wrapper">
              <IconifyIcon
                icon="ant-design:customer-service-outlined"
                class="chat-icon"
              />
            </div>
          </Badge>
        </div>
      </Tooltip>
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar
      >
        <LoginForm />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar @to-login="handleLogout" />
    </template>
  </BasicLayout>

  <!-- 客服上线确认弹窗（放在 BasicLayout 外面，确保正确渲染） -->
  <OnlineConfirmModal
    v-model:open="showOnlineConfirmModal"
    @confirmed="
      (isOnline, goToWorkbench) =>
        handleOnlineConfirmed(isOnline, goToWorkbench)
    "
  />
</template>

<style scoped>
.chat-notification {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.chat-notification:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.chat-icon-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.chat-icon {
  font-size: 18px;
  color: hsl(var(--foreground));
}
</style>
