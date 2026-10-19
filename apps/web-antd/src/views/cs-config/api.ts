import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取客服配置
 */
export async function getConfig() {
  return requestClient.get('/CustomerServiceConfig/GetConfig');
}

/**
 * 保存客服配置
 */
export async function saveConfig(data: any) {
  return sbRequestClient.post('/CustomerServiceConfig/SaveConfig', data);
}
