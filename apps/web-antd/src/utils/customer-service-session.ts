/**
 * 客服会话状态管理
 * 使用 sessionStorage 存储当前浏览器会话的客服状态
 * sessionStorage 在标签页关闭时自动清除，刷新页面时保留
 */

const STORAGE_KEY_CONFIRMED = 'cs_online_confirmed';
const STORAGE_KEY_ONLINE_STATUS = 'cs_online_status';

export const customerServiceSession = {
  /**
   * 检查当前会话是否已确认过在线状态
   */
  isConfirmed(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(STORAGE_KEY_CONFIRMED) === 'true';
  },

  /**
   * 设置确认状态
   * @param isOnline 是否选择在线
   */
  setConfirmed(isOnline: boolean): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY_CONFIRMED, 'true');
    sessionStorage.setItem(STORAGE_KEY_ONLINE_STATUS, isOnline ? '1' : '0');
  },

  /**
   * 获取保存的在线状态
   * @returns true-在线, false-离线, null-未设置
   */
  getOnlineStatus(): boolean | null {
    if (typeof window === 'undefined') return null;
    const status = sessionStorage.getItem(STORAGE_KEY_ONLINE_STATUS);
    if (status === null) return null;
    return status === '1';
  },

  /**
   * 清除会话状态（登出时调用）
   */
  clear(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(STORAGE_KEY_CONFIRMED);
    sessionStorage.removeItem(STORAGE_KEY_ONLINE_STATUS);
  },
};
