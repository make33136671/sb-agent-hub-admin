import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取聊天用户列表
 */
export async function getList(params: any) {
  return requestClient.get('/ChatUser/List', { params });
}

/**
 * 获取聊天用户详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/ChatUser/Detail', { params: { id } });
}

/**
 * 编辑聊天用户
 */
export async function postEdit(params: any) {
  return sbRequestClient.post('/ChatUser/Edit', params);
}

/**
 * 删除聊天用户
 */
export async function postDel(id: number) {
  return sbRequestClient.post('/ChatUser/Del', { id });
}

/**
 * 更新用户状态
 */
export async function postUpdateStatus(id: number, status: number) {
  return sbRequestClient.post('/ChatUser/UpdateStatus', { id, status });
}

/**
 * 加入黑名单
 */
export async function postAddToBlacklist(id: number) {
  return sbRequestClient.post('/ChatUser/AddToBlacklist', { id });
}

/**
 * 移出黑名单
 */
export async function postRemoveFromBlacklist(id: number) {
  return sbRequestClient.post('/ChatUser/RemoveFromBlacklist', { id });
}

/**
 * 分配客服
 */
export async function postAssignAgent(chatUserId: number, agentId: number) {
  return sbRequestClient.post('/ChatUser/AssignAgent', { chatUserId, agentId });
}

/**
 * 获取在线用户
 */
export async function getOnlineUsers(ownerId?: number) {
  return requestClient.get('/ChatUser/OnlineUsers', {
    params: ownerId ? { ownerId } : {},
  });
}

/**
 * 更新备注
 */
export async function postUpdateRemark(id: number, nicknameRemark: string, remark: string) {
  return sbRequestClient.post('/ChatUser/UpdateRemark', { id, nicknameRemark, remark });
}
