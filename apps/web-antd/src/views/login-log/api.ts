import { requestClient } from '#/api/request';

/**
 * 获取登录日志列表
 */
export async function getList(params: {
  userType?: number;
  username?: string;
  status?: number;
  page: number;
  pageSize: number;
}) {
  return requestClient.get('/LoginLog/List', { params });
}
