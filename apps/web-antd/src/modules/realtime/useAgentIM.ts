import { ref } from 'vue';
import type { Ref } from 'vue';

import {
  classifyMessage,
  SystemMsg,
  type Conversation,
  type Message,
  type MessageClassification,
  type ReadReceiptInfo,
} from '@saiboniuma/realtime-core';

import { playNewMessage, playSystemNotification } from '#/utils/notification-sound';

import { destroyCore, getCore, hasCore } from './config';

const isConnected = ref(false);
const isConnecting = ref(false);
const imError = ref<null | string>(null);
const imUserId = ref<null | string>(null);
const messages = ref<Message[]>([]);
const conversations = ref<Conversation[]>([]);
const previewMap = ref<Map<string, string>>(new Map());
const senderInfoMap = ref<Map<string, { nickname: string; faceURL: string }>>(new Map());
const systemUnreadOffset = ref<Map<string, number>>(new Map());

let eventListenersRegistered = false;
let activeConversationUserID: null | string = null;
let activeVisitorUserID: null | string = null;
let onVisitorStatusChangeCallback:
  | ((visitorUserId: string, online: boolean) => void)
  | null = null;
const joinedConversationIds = new Set<string>();

function getConversationKey(message: Message): null | string {
  const groupID = (message as any).groupID as string | undefined;
  if (groupID) return groupID;
  const myId = imUserId.value;
  if (!myId) return null;
  return message.sendID === myId ? message.recvID : message.sendID;
}

async function fetchSenderInfos(userIDs: string[]): Promise<void> {
  const uncached = userIDs.filter((id) => id && !senderInfoMap.value.has(id));
  if (uncached.length === 0) return;
  try {
    const core = getCore();
    for (const id of uncached) {
      const info = await core.getUserInfo();
      if (info && info.userID === id) {
        senderInfoMap.value.set(id, {
          nickname: info.nickname || '',
          faceURL: info.faceURL || '',
        });
      }
    }
  } catch {
    // ignore
  }
}

function handleConnecting(): void {
  isConnecting.value = true;
}

function handleConnectSuccess(): void {
  isConnected.value = true;
  isConnecting.value = false;
  imError.value = null;
}

function handleConnectFailed(): void {
  isConnected.value = false;
  isConnecting.value = false;
  imError.value = 'Realtime 连接失败';
  // 连接断开后清空已加入组缓存（SignalR 重连后组关系失效，需要重新加入）
  joinedConversationIds.clear();
}

function handleKickedOffline(): void {
  isConnected.value = false;
  imError.value = '账号在其他设备登录';
  joinedConversationIds.clear();
}

function handleTokenExpired(): void {
  isConnected.value = false;
  imError.value = 'Token 已过期';
  joinedConversationIds.clear();
}

function handleNewMessage(message: Message): void {
  console.log('[IM] 收到消息:', message.contentType, message);
  const cls = classifyMessage(message);

  applyMessageSideEffects(message, cls);

  if (message.sendID && !senderInfoMap.value.has(message.sendID)) {
    fetchSenderInfos([message.sendID]);
  }

  if (!cls.showInChat) {
    const key = getConversationKey(message);
    if (key) {
      const cur = systemUnreadOffset.value.get(key) || 0;
      systemUnreadOffset.value.set(key, cur + 1);
    }
  }

  if (cls.showInChat) {
    pushToCurrentConversation(message);
  }

  if (cls.showInListPreview && cls.previewText) {
    const key = getConversationKey(message);
    if (key) {
      previewMap.value.set(key, cls.previewText);
    }
  }

  if (cls.showInChat) {
    if (cls.systemType) {
      playSystemNotification();
    } else {
      playNewMessage();
    }
  }

  loadConversationsInternal().catch(() => {});
}

function applyMessageSideEffects(
  message: Message,
  cls: MessageClassification,
): void {
  // 调试：打印所有系统消息
  if (cls.systemType) {
    console.log('[IM] 系统消息:', cls.systemType, message);
  }

  if (cls.systemType === SystemMsg.MessageRead) {
    for (const msg of messages.value) {
      if (msg.sendID === imUserId.value) {
        msg.isRead = true;
      }
    }
  }

  if (
    cls.systemType === SystemMsg.VisitorOnline ||
    cls.systemType === SystemMsg.VisitorOffline
  ) {
    // 从系统消息 payload 中提取访客 ID（sendID 是 "system"，不是访客 ID）
    let visitorUserId = '';
    try {
      const data = JSON.parse(message.customElem?.data || '{}');
      visitorUserId = data.visitorId || data.userId || data.chatUserId || '';
    } catch {
      // 解析失败时兜底用 sendID
      visitorUserId = message.sendID;
    }
    if (visitorUserId && onVisitorStatusChangeCallback) {
      onVisitorStatusChangeCallback(
        visitorUserId,
        cls.systemType === SystemMsg.VisitorOnline,
      );
    }
  }
}

function pushToCurrentConversation(message: Message): void {
  if (!activeConversationUserID) return;

  const belongsToCurrent =
    message.sendID === activeConversationUserID ||
    message.recvID === activeConversationUserID ||
    (message as any).groupID === activeConversationUserID ||
    (activeVisitorUserID && (
      message.sendID === activeVisitorUserID ||
      message.recvID === activeVisitorUserID
    ));

  if (!belongsToCurrent) return;

  const exists = messages.value.some(
    (m) => m.clientMsgID === message.clientMsgID,
  );
  if (!exists) {
    messages.value.push(message);
  }
}

function handleReadReceipt(receipts: ReadReceiptInfo[]): void {
  for (const receipt of receipts) {
    if (!receipt.msgIDList?.length) continue;
    const readSet = new Set(receipt.msgIDList);
    for (const msg of messages.value) {
      if (readSet.has(msg.clientMsgID) || readSet.has(msg.serverMsgID)) {
        msg.isRead = true;
      }
    }
  }
}

function handleConversationChanged(convs: Conversation[]): void {
  for (const conv of convs) {
    const idx = conversations.value.findIndex(
      (c) => c.conversationID === conv.conversationID,
    );
    if (idx >= 0) {
      conversations.value[idx] = conv;
    } else {
      conversations.value.push(conv);
    }
  }
}

function handleNewConversation(_data: { conversationId: string; visitorName?: string }): void {
  // 收到新会话通知，刷新会话列表并加入 SignalR 组
  loadConversationsInternal().catch(() => {});
}

async function loadConversationsInternal(): Promise<void> {
  try {
    const core = getCore();
    const list = await core.conversation.getList();
    conversations.value = list;

    // 加入尚未加入的会话组，确保能接收每个会话的实时消息（如下线通知等）
    for (const conv of list) {
      if (joinedConversationIds.has(conv.conversationID)) continue;
      try {
        await core.conversation.joinConversation(conv.conversationID);
        joinedConversationIds.add(conv.conversationID);
      } catch {
        // 忽略单个会话加入失败
      }
    }
  } catch {
    // ignore
  }
}

function registerEventListeners(): void {
  if (eventListenersRegistered) return;
  eventListenersRegistered = true;

  const core = getCore();
  core.on('connection:connecting', handleConnecting);
  core.on('connection:success', handleConnectSuccess);
  core.on('connection:failed', handleConnectFailed);
  core.on('kicked:offline', handleKickedOffline);
  core.on('token:expired', handleTokenExpired);
  core.on('message:received:raw', handleNewMessage);
  core.on('message:read-receipt', handleReadReceipt);
  core.on('conversation:changed', handleConversationChanged);
  core.on('conversation:new', handleNewConversation);
}

export interface AgentImTokenData {
  imUserId: string;
  token: string;
  expireTimeSeconds: number;
}

export interface UseAgentIMReturn {
  isConnected: Ref<boolean>;
  isConnecting: Ref<boolean>;
  imError: Ref<null | string>;
  imUserId: Ref<null | string>;
  messages: Ref<Message[]>;
  conversations: Ref<Conversation[]>;
  previewMap: Ref<Map<string, string>>;
  senderInfoMap: Ref<Map<string, { nickname: string; faceURL: string }>>;
  systemUnreadOffset: Ref<Map<string, number>>;

  login: (tokenData: AgentImTokenData) => Promise<void>;
  logout: () => Promise<void>;
  loadHistoryWithUser: (
    userID: string,
    count?: number,
    sessionType?: number,
    visitorUserID?: string,
  ) => Promise<void>;
  sendText: (
    recvID: string,
    text: string,
    isGroup?: boolean,
  ) => Promise<Message>;
  sendImage: (
    recvID: string,
    file: File,
    isGroup?: boolean,
  ) => Promise<Message>;
  onVisitorStatusChange: (
    cb: (visitorUserId: string, online: boolean) => void,
  ) => void;
  getPreviewText: (conversationKey: string, conversation?: Conversation) => string;
  /** 确保已加入对应用户的单聊会话组（用于接收实时消息推送） */
  ensureJoinedWithUser: (userID: string) => Promise<void>;
  destroy: () => void;
}

export function useAgentIM(): UseAgentIMReturn {
  registerEventListeners();

  async function login(tokenData: AgentImTokenData): Promise<void> {
    registerEventListeners();
    const core = getCore();
    isConnecting.value = true;
    imError.value = null;

    try {
      await core.login(tokenData.imUserId, tokenData.token);
      imUserId.value = tokenData.imUserId;

      // 登录成功后立即加载会话列表并加入所有会话组
      // 确保能及时接收各会话的实时消息（如下线通知等）
      loadConversationsInternal().catch(() => {});
    } catch (err: any) {
      isConnecting.value = false;
      isConnected.value = false;
      imError.value = err?.message || 'Realtime 登录失败';
      throw err;
    }
  }

  async function logout(): Promise<void> {
    if (imUserId.value && hasCore()) {
      try {
        await getCore().logout();
      } catch {
        // ignore
      }
    }
    isConnected.value = false;
    isConnecting.value = false;
    imError.value = null;
    imUserId.value = null;
    messages.value = [];
    conversations.value = [];
    previewMap.value.clear();
    senderInfoMap.value.clear();
    systemUnreadOffset.value.clear();
    joinedConversationIds.clear();
    activeVisitorUserID = null;
  }

  async function loadHistoryWithUser(
    userID: string,
    count: number = 100,
    sessionType: number = 1,
    visitorUserID?: string,
  ): Promise<void> {
    activeConversationUserID = userID;
    activeVisitorUserID = visitorUserID || (sessionType === 1 ? userID : null);
    const core = getCore();

    let conversationID: null | string = null;
    try {
      const conversation = await core.conversation.getOne(
        userID,
        sessionType,
      );
      if (conversation) {
        conversationID = conversation.conversationID;
      }
    } catch {
      // ignore
    }

    if (!conversationID) {
      const fallback = conversations.value.find((c) =>
        sessionType === 3 ? c.groupID === userID : c.userID === userID,
      );
      if (fallback) {
        conversationID = fallback.conversationID;
      }
    }

    if (conversationID) {
      // 设置当前会话 ID（消息发送需要）
      core.setConversationId(conversationID);

      // 显式加入会话组，确保接收实时消息推送
      try {
        if (!joinedConversationIds.has(conversationID)) {
          await core.conversation.joinConversation(conversationID);
          joinedConversationIds.add(conversationID);
        }
      } catch {
        // ignore
      }

      try {
        const history = await core.conversation.getHistory(
          conversationID,
          count,
        );
        const sorted = history.sort((a, b) => a.sendTime - b.sendTime);
        const filtered: Message[] = [];
        let latestPreview = '';

        for (const msg of sorted) {
          const cls = classifyMessage(msg);
          if (cls.showInChat) {
            filtered.push(msg);
          }
          if (cls.showInListPreview && cls.previewText) {
            latestPreview = cls.previewText;
          }
        }

        messages.value = filtered;

        if (latestPreview) {
          previewMap.value.set(userID, latestPreview);
        }

        const senderIDs = [...new Set(filtered.map((m) => m.sendID).filter(Boolean))];
        fetchSenderInfos(senderIDs);

        systemUnreadOffset.value.set(userID, 0);
        try {
          await core.conversation.markAsRead(conversationID);
          loadConversationsInternal().catch(() => {});
        } catch {
          // ignore
        }

        return;
      } catch {
        // ignore
      }
    }

    messages.value = [];
  }

  async function sendText(
    recvID: string,
    text: string,
    isGroup: boolean = false,
  ): Promise<Message> {
    const core = getCore();
    const msg = await core.message.sendText(recvID, text, isGroup);
    const exists = messages.value.some(
      (m) => m.clientMsgID === msg.clientMsgID,
    );
    if (!exists) {
      messages.value.push(msg);
    }
    const cls = classifyMessage(msg);
    if (cls.showInListPreview && cls.previewText) {
      const key = getConversationKey(msg);
      if (key) {
        previewMap.value.set(key, cls.previewText);
      }
    }
    return msg;
  }

  async function sendImage(
    recvID: string,
    file: File,
    isGroup: boolean = false,
  ): Promise<Message> {
    const core = getCore();
    const uploadResult = await core.upload.uploadFile(file);
    const dimensions = await core.upload.getImageDimensions(file);
    const msg = await core.message.sendImage(
      recvID,
      file,
      uploadResult.absfileName,
      {
        width: dimensions.width,
        height: dimensions.height,
        size: file.size,
        type: file.type,
      },
      isGroup,
    );
    const exists = messages.value.some(
      (m) => m.clientMsgID === msg.clientMsgID,
    );
    if (!exists) {
      messages.value.push(msg);
    }
    previewMap.value.set(recvID, '[图片]');
    return msg;
  }

  function getPreviewText(
    conversationKey: string,
    conversation?: Conversation,
  ): string {
    const cached = previewMap.value.get(conversationKey);
    if (cached) return cached;

    if (conversation?.latestMsg) {
      try {
        const msg: Message = JSON.parse(conversation.latestMsg);
        const cls = classifyMessage(msg);
        if (cls.showInListPreview && cls.previewText) {
          return cls.previewText;
        }
      } catch {
        // ignore
      }
    }

    return '';
  }

  function onVisitorStatusChange(
    cb: (visitorUserId: string, online: boolean) => void,
  ): void {
    onVisitorStatusChangeCallback = cb;
  }

  function destroy(): void {
    destroyCore();
    isConnected.value = false;
    isConnecting.value = false;
    imError.value = null;
    imUserId.value = null;
    messages.value = [];
    conversations.value = [];
    previewMap.value.clear();
    senderInfoMap.value.clear();
    joinedConversationIds.clear();
    activeVisitorUserID = null;
    eventListenersRegistered = false;
  }

  /**
   * 确保已加入指定用户的单聊会话组。
   * 用于 admin 端批量加入所有访客会话组，以便接收上下线通知等实时消息。
   */
  async function ensureJoinedWithUser(userID: string): Promise<void> {
    if (!userID) return;
    try {
      const core = getCore();
      if (!core.isConnected()) {
        console.log('[IM] ensureJoinedWithUser 跳过: 未连接', userID);
        return;
      }

      // 先尝试从已有会话列表中查找
      let conversationID: string | null = null;
      const existing = conversations.value.find((c) => c.userID === userID);
      if (existing) {
        conversationID = existing.conversationID;
        console.log('[IM] 从会话列表找到:', userID, conversationID);
      } else {
        // 会话列表中没有，向服务器查询
        try {
          const conv = await core.conversation.getOne(userID, 1);
          if (conv) {
            conversationID = conv.conversationID;
            console.log('[IM] 从服务器获取会话:', userID, conversationID);
          } else {
            console.log('[IM] 会话不存在:', userID);
            return;
          }
        } catch (e) {
          console.log('[IM] 获取会话失败:', userID, e);
          return;
        }
      }

      if (conversationID && !joinedConversationIds.has(conversationID)) {
        console.log('[IM] 加入会话组:', conversationID, '用户:', userID);
        await core.conversation.joinConversation(conversationID);
        joinedConversationIds.add(conversationID);
        console.log('[IM] 已加入会话组:', conversationID);
      } else if (conversationID) {
        console.log('[IM] 已在会话组中，跳过:', conversationID);
      }
    } catch (e) {
      console.log('[IM] ensureJoinedWithUser 异常:', userID, e);
    }
  }

  return {
    isConnected,
    isConnecting,
    imError,
    imUserId,
    messages,
    conversations,
    previewMap,
    senderInfoMap,
    systemUnreadOffset,
    login,
    logout,
    loadHistoryWithUser,
    sendText,
    sendImage,
    onVisitorStatusChange,
    getPreviewText,
    ensureJoinedWithUser,
    destroy,
  };
}
