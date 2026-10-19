import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取我的客服列表（Owner 专用）
 */
export async function getMyAgents(params?: any) {
  return requestClient.get('/Member/List', {
    params: { ...params, role: 1 },
  });
}

/**
 * 获取客服详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/Member/Detail', { params: { id } });
}

/**
 * 新增客服
 */
export async function postAdd(data: any) {
  return sbRequestClient.post('/Member/Add', { ...data, role: 1 });
}

/**
 * 编辑客服
 */
export async function postEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/Member/Edit', params);
  }
  return postAdd(params);
}

/**
 * 删除客服
 */
export async function postDel(id: number) {
  return sbRequestClient.post('/Member/Del', { id });
}

/**
 * 重置密码
 */
export async function postResetPassword(id: number, newPassword: string) {
  return sbRequestClient.post('/Member/ResetPassword', { id, newPassword });
}

/**
 * 切换状态
 */
export async function postToggleStatus(id: number) {
  return sbRequestClient.post('/Member/ToggleStatus', { id });
}
