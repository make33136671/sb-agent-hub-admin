import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 声音设置接口
 */
export interface SoundSettings {
  newMessageEnabled: boolean;
  newMessageSound: string;
  newMessageVolume: number;
  systemNotificationEnabled: boolean;
  systemNotificationSound: string;
  systemNotificationVolume: number;
}

/**
 * 可用提示音选项
 */
export interface SoundOption {
  value: string;
  label: string;
}

/**
 * 获取声音设置
 */
export async function getSoundSettingsApi() {
  return requestClient.get<SoundSettings>(
    '/UserPreferences/GetSoundSettings',
  );
}

/**
 * 保存声音设置
 */
export async function saveSoundSettingsApi(data: Partial<SoundSettings>) {
  return sbRequestClient.post('/UserPreferences/SaveSoundSettings', data);
}

/**
 * 获取可用提示音列表
 */
export async function getAvailableSoundsApi() {
  return requestClient.get<SoundOption[]>(
    '/UserPreferences/GetAvailableSounds',
  );
}
