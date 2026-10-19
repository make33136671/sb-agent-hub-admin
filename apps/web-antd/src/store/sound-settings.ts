/**
 * 声音设置 Store - App 层初始化
 *
 * 这个文件负责：
 * 1. 重新导出 @vben/stores 中的 useSoundSettingsStore
 * 2. 提供初始化函数，注册 API 回调
 */

import {
  registerSoundSettingsApiCallbacks,
  useSoundSettingsStore,
  type SoundOption,
  type SoundSettings,
} from '@vben/stores';

import {
  getAvailableSoundsApi,
  getSoundSettingsApi,
  saveSoundSettingsApi,
} from '#/api/core/user-preferences';

// 注册 API 回调
registerSoundSettingsApiCallbacks({
  fetchSettings: async (): Promise<SoundSettings | null> => {
    try {
      const result = await getSoundSettingsApi();
      return result || null;
    } catch {
      return null;
    }
  },
  fetchSounds: async (): Promise<SoundOption[] | null> => {
    try {
      const result = await getAvailableSoundsApi();
      return result || null;
    } catch {
      return null;
    }
  },
  saveSettings: async (settings: SoundSettings): Promise<boolean> => {
    try {
      await saveSoundSettingsApi(settings);
      return true;
    } catch {
      return false;
    }
  },
});

// 重新导出
export { useSoundSettingsStore };
export type { SoundOption, SoundSettings };
