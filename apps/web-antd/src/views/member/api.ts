import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取会员列表（站长/客服）
 */
export async function getList(params: any) {
  return requestClient.get('/Member/List', { params });
}

/**
 * 获取单个会员详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/Member/Detail', { params: { id } });
}

/**
 * 新增会员
 */
export async function postAdd(data: any) {
  return sbRequestClient.post('/Member/Add', data);
}

/**
 * 保存会员详情
 */
export async function postEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/Member/Edit', params);
  } else {
    return postAdd(params);
  }
}

/**
 * 删除会员
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
 * 切换状态（启用/封禁）
 */
export async function postToggleStatus(id: number) {
  return sbRequestClient.post('/Member/ToggleStatus', { id });
}

/**
 * 获取站长下属的客服列表
 */
export async function getAgentsByOwner(ownerId: number) {
  return requestClient.get('/Member/AgentsByOwner', { params: { ownerId } });
}

/**
 * 获取站长选项列表（用于下拉选择）
 */
export async function getOwnerOptions() {
  return requestClient.get('/ChatPlatform/OwnerOptions');
}
