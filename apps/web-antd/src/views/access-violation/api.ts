import { requestClient } from '#/api/request';

/**
 * 非法接入日志列表
 */
export async function getList(params: any) {
  return requestClient.get('/AccessViolation/List', { params });
}

/**
 * 统计概览
 */
export async function getStats(params?: { ownerId?: number; days?: number }) {
  return requestClient.get('/AccessViolation/Stats', { params });
}
