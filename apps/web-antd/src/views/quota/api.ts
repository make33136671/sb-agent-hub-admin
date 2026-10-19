import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取配额定义列表
 */
export async function getQuotaConfigs(enabledOnly = true) {
  return requestClient.get('/Quota/Configs', { params: { enabledOnly } });
}

/**
 * 获取站长配额（含使用量）
 */
export async function getMemberQuotas(memberId: number) {
  return requestClient.get('/Quota/MemberQuotas', { params: { memberId } });
}

/**
 * 设置单个配额
 */
export async function postSetQuota(data: {
  memberId: number;
  quotaKey: string;
  quotaValue: number;
  remark?: string;
}) {
  return sbRequestClient.post('/Quota/SetQuota', data);
}

/**
 * 批量设置配额
 */
export async function postBatchSet(data: {
  memberId: number;
  quotas: Array<{ quotaKey: string; quotaValue: number }>;
  remark?: string;
}) {
  return requestClient.post('/Quota/BatchSet', data);
}

/**
 * 配额使用概览
 */
export async function getUsageSummary(memberId: number) {
  return requestClient.get('/Quota/UsageSummary', { params: { memberId } });
}

/**
 * 站长选项列表
 */
export async function getOwnerOptions() {
  return requestClient.get('/Quota/OwnerOptions');
}
