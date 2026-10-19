import { computed, ref, watch } from 'vue';

import { useUserStore } from '@vben/stores';
import { defineStore } from 'pinia';

import { useAgentIM, updateRealtimeAddrs, getCore } from '#/modules/realtime';
import { requestPermission as requestAudioPermission } from '#/utils/notification-sound';

import { getAgentImToken, getMyStatus, getMyVisitors, getQueueWaitingList, postAcceptFromQueue, postUpdateStatus } from './api';

export const useWorkbenchStore = defineStore('workbench', () => {
  // --- IM composable ---
  const {
    isConnected: imConnected,
    isConnecting: imConnecting,
    imError,
    imUserId,
    messages: imMessages,
    conversations: imConversations,
    previewMap: imPreviewMap,
    senderInfoMap: imSenderInfoMap,
    systemUnreadOffset: imSystemUnreadOffset,
    login: imLogin,
    logout: imLogout,
    loadHistoryWithUser: imLoadHistory,
    sendText: imSendText,
    sendImage: imSendImage,
    onVisitorStatusChange,
    getPreviewText: imGetPreviewText,
    ensureJoinedWithUser: imEnsureJoinedWithUser,
    destroy: imDestroy,
  } = useAgentIM();

  // 收到访客上线/离线系统消息时，立即更新列表中对应访客的在线状态
  onVisitorStatusChange((visitorUserId, online) => {
    const visitor = visitors.value.find(
      (v: any) => v.chatUserId === visitorUserId,
    );
    if (visitor) {
      visitor.onlineStatus = online ? 1 : 0;
    }
    if (activeVisitor.value?.chatUserId === visitorUserId) {
      activeVisitor.value.onlineStatus = online ? 1 : 0;
    }
  });

  /** 获取访客的群组 ID */
  function getVisitorGroupId(visitor: any): string | null {
    return visitor?.groupId || null;
  }

  // --- 访客列表 ---
  const visitors = ref<any[]>([]);
  const visitorLoading = ref(false);
  const activeVisitor = ref<any>(null);
  const searchKeyword = ref('');

  // --- 排队列表 ---
  const queueList = ref<any[]>([]);
  const queueLoading = ref(false);

  // --- 清除缓存登录 ---
  const clearCacheOnLogin = ref(false);

  // --- 状态模型 ---
  /** 用户在 StatusSwitch 中选择的期望状态 */
  const userDesiredStatus = ref(0);
  /** 后端返回的原始状态 */
  const backendStatus = ref({
    onlineStatus: 0,
    maxConcurrent: 0,
    currentCount: 0,
    visitorCount: 0,
  });
  /** 操作进行中标志 */
  const statusSwitching = ref(false);

  /** 有效在线状态 = 用户期望上线 + IM 已连接 */
  const effectiveOnlineStatus = computed(() => {
    if (userDesiredStatus.value >= 1 && imConnected.value) {
      return userDesiredStatus.value;
    }
    return 0;
  });

  /** 兼容现有模板的 agentStatus */
  const agentStatus = computed(() => ({
    onlineStatus: effectiveOnlineStatus.value,
    maxConcurrent: backendStatus.value.maxConcurrent,
    currentCount: backendStatus.value.currentCount,
    visitorCount: backendStatus.value.visitorCount,
  }));

  // --- IM 断连自动同步后端 & 重连后重新加入会话组 ---
  watch(imConnected, (connected, was) => {
    if (was && !connected && userDesiredStatus.value >= 1) {
      postUpdateStatus(0).catch(() => {});
    }
    // IM 连接成功且已有访客列表时，批量加入会话组
    if (connected && visitors.value.length > 0) {
      (async () => {
        for (const v of visitors.value) {
          if (v?.chatUserId) {
            await imEnsureJoinedWithUser(v.chatUserId);
          }
        }
      })();
    }
  });

  // --- 访客相关方法 ---
  async function loadVisitors(keyword = '') {
    visitorLoading.value = true;
    try {
      const result: any = await getMyVisitors({ keyword, page: 1, pageSize: 100 });
      if (result?.items) {
        visitors.value = result.items;
      } else if (Array.isArray(result)) {
        visitors.value = result;
      }

      // 异步加入所有访客的会话组，确保能接收上下线等实时通知
      // （不等待完成，避免阻塞 UI）
      if (imConnected.value) {
        (async () => {
          for (const v of visitors.value) {
            if (v?.chatUserId) {
              await imEnsureJoinedWithUser(v.chatUserId);
            }
          }
        })();
      }
    } finally {
      visitorLoading.value = false;
    }
  }

  function selectVisitor(visitor: any) {
    activeVisitor.value = visitor;
  }

  // --- 状态相关方法 ---
  async function loadMyStatus() {
    try {
      const data: any = await getMyStatus();
      if (data) {
        backendStatus.value = {
          onlineStatus: data.onlineStatus ?? 0,
          maxConcurrent: data.maxConcurrent ?? 0,
          currentCount: data.currentCount ?? 0,
          visitorCount: data.visitorCount ?? 0,
        };
        // 同步用户期望状态
        if (data.onlineStatus >= 1) {
          userDesiredStatus.value = data.onlineStatus;
        }
      }
    } catch {
      // ignore
    }
  }

  /** 加载排队列表 */
  async function loadQueueList() {
    queueLoading.value = true;
    try {
      const result: any = await getQueueWaitingList();
      queueList.value = Array.isArray(result) ? result : [];
    } catch {
      queueList.value = [];
    } finally {
      queueLoading.value = false;
    }
  }

  /** 接入排队访客 */
  async function acceptFromQueue(chatUserId: string) {
    await postAcceptFromQueue(chatUserId);
    // 刷新排队列表和访客列表
    await Promise.all([loadQueueList(), loadVisitors(searchKeyword.value)]);
  }

  /** 获取当前 memberId */
  function getMemberId(): number {
    const userStore = useUserStore();
    return Number(userStore.userInfo?.userId) || 0;
  }

  /** 上线：获取 IM Token → 连接 → 通知后端 */
  async function goOnline(status: number) {
    statusSwitching.value = true;
    userDesiredStatus.value = status;

    try {
      // 在用户交互上下文中请求音频权限（点击上线按钮 = 用户交互）
      await requestAudioPermission();

      const memberId = getMemberId();
      if (!memberId) throw new Error('无法获取用户 ID');

      // 清除缓存登录：销毁 SDK 实例（含重置事件监听标志），强制获取新 token
      const forceNew = clearCacheOnLogin.value;
      if (forceNew) {
        imDestroy();
      }

      // 获取 IM Token
      const tokenData: any = await getAgentImToken(memberId, forceNew || undefined);
      if (!tokenData?.userId || !tokenData?.token) {
        throw new Error('获取 IM Token 失败');
      }

      // 用服务端下发的 Realtime 地址更新配置
      if (tokenData.realtimeConfig) {
        // SignalR 浏览器端 negotiate 走 HTTP fetch，ws:// scheme 会直接报错，需转 http(s)
        const httpUrl = String(tokenData.realtimeConfig.wsUrl).replace(/^ws/, 'http');
        updateRealtimeAddrs(httpUrl);
      }

      // 连接 Realtime
      await imLogin({
        imUserId: String(tokenData.userId),
        token: tokenData.token,
        expireTimeSeconds: tokenData.expireTimeSeconds ?? 0,
      });

      // 同步用户头像和昵称（确保消息中携带头像）
      try {
        const userStore = useUserStore();
        const avatar = (userStore.userInfo as any)?.avatar || '';
        const nickname = (userStore.userInfo as any)?.realName || '';
        const core = getCore();
        await core.auth.updateUserInfo(core.getConfig().platformKey, '', undefined, nickname, avatar);
      } catch {
        // 头像同步失败不影响上线
      }

      // 连接成功，通知后端
      await postUpdateStatus(status);
      backendStatus.value.onlineStatus = status;
      clearCacheOnLogin.value = false;
    } catch (err) {
      // 失败回退
      console.error('[goOnline] 上线失败:', err);
      userDesiredStatus.value = 0;
      try {
        await imLogout();
      } catch {
        // ignore
      }
    } finally {
      statusSwitching.value = false;
    }
  }

  /** 离线：断开 IM → 通知后端 */
  async function goOffline() {
    statusSwitching.value = true;
    userDesiredStatus.value = 0;

    try {
      await imLogout();
      await postUpdateStatus(0);
      backendStatus.value.onlineStatus = 0;
    } catch {
      // ignore
    } finally {
      statusSwitching.value = false;
    }
  }

  /** 统一状态切换入口（StatusSwitch 调用） */
  async function updateStatus(status: number) {
    if (status === 0) {
      await goOffline();
      return;
    }

    // 已连接且在在线状态间切换（在线→忙碌等），只更新后端
    if (imConnected.value && userDesiredStatus.value >= 1) {
      statusSwitching.value = true;
      userDesiredStatus.value = status;
      try {
        await postUpdateStatus(status);
        backendStatus.value.onlineStatus = status;
      } catch {
        // ignore
      } finally {
        statusSwitching.value = false;
      }
      return;
    }

    // 未连接，需要完整上线流程
    await goOnline(status);
  }

  return {
    // 访客
    visitors,
    visitorLoading,
    activeVisitor,
    searchKeyword,
    loadVisitors,
    selectVisitor,
    getVisitorGroupId,

    // 清除缓存
    clearCacheOnLogin,

    // 状态
    agentStatus,
    backendStatus,
    userDesiredStatus,
    statusSwitching,
    effectiveOnlineStatus,
    loadMyStatus,
    updateStatus,
    goOnline,
    goOffline,

    // 排队
    queueList,
    queueLoading,
    loadQueueList,
    acceptFromQueue,

    // IM 状态（供组件使用）
    imConnected,
    imConnecting,
    imError,
    imUserId,
    imMessages,
    imConversations,
    imPreviewMap,
    imSenderInfoMap,
    imSystemUnreadOffset,
    imLoadHistory,
    imSendText,
    imSendImage,
    imGetPreviewText,

    // 当前客服信息（头像、昵称）
    agentAvatar: computed(() => {
      const userStore = useUserStore();
      return (userStore.userInfo as any)?.avatar || '';
    }),
    agentNickname: computed(() => {
      const userStore = useUserStore();
      return (userStore.userInfo as any)?.realName || '';
    }),

    /** 获取某个访客的未读消息数（扣除系统消息偏移） */
    getVisitorUnread(visitor: any): number {
      const groupId = visitor.groupId;
      const chatUserId = visitor.chatUserId;
      const key = groupId || chatUserId;
      const conv = groupId
        ? imConversations.value.find((c: any) => c.groupID === groupId)
        : imConversations.value.find((c: any) => c.userID === chatUserId);
      if (!conv) return 0;
      const raw = (conv as any).unreadCount || 0;
      const offset = imSystemUnreadOffset.value.get(key) || 0;
      return Math.max(0, raw - offset);
    },

    // 未读消息总数（扣除系统消息偏移）
    totalUnreadCount: computed(() => {
      let total = 0;
      for (const visitor of visitors.value) {
        const groupId = visitor.groupId;
        const chatUserId = visitor.chatUserId;
        const key = groupId || chatUserId;
        const conv = groupId
          ? imConversations.value.find((c: any) => c.groupID === groupId)
          : imConversations.value.find((c: any) => c.userID === chatUserId);
        if (conv) {
          const raw = (conv as any).unreadCount || 0;
          const offset = imSystemUnreadOffset.value.get(key) || 0;
          total += Math.max(0, raw - offset);
        }
      }
      return total;
    }),
  };
});
