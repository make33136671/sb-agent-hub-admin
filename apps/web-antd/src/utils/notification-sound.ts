/**
 * 声音通知模块
 *
 * 外部只需调用:
 *   playNewMessage()        — 新消息来了
 *   playSystemNotification() — 系统消息来了
 *   requestPermission()     — 请求音频播放权限（需在用户交互上下文中调用）
 *
 * 是否播放、播放什么声音、音量，全部由内部根据用户设置自动处理。
 */

import { useSoundSettingsStore } from '@vben/stores';

// ========== 音频权限 ==========

let silentAudio: HTMLAudioElement | null = null;
let permissionGranted = false;

function createSilentAudio() {
  if (typeof window === 'undefined') return;
  try {
    silentAudio = new Audio();
    silentAudio.src =
      'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==';
    silentAudio.volume = 0.01;
  } catch {
    // ignore
  }
}

createSilentAudio();

/**
 * 请求音频播放权限（必须在用户交互上下文中调用，如点击事件）
 */
export async function requestPermission(): Promise<boolean> {
  if (permissionGranted) return true;
  if (!silentAudio) return false;

  try {
    await silentAudio.play();
    silentAudio.pause();
    silentAudio.currentTime = 0;
    permissionGranted = true;
    return true;
  } catch {
    return false;
  }
}

// ========== 播放通知 ==========

function getStore() {
  return useSoundSettingsStore();
}

/** 新消息提示音（是否播放、播放什么由用户设置决定） */
export function playNewMessage() {
  getStore().playNewMessageSound();
}

/** 系统通知提示音（是否播放、播放什么由用户设置决定） */
export function playSystemNotification() {
  getStore().playSystemNotificationSound();
}
