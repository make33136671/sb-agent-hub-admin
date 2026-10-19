import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取我的访客列表
 */
export async function getMyVisitors(params?: { keyword?: string; page?: number; pageSize?: number }) {
  return requestClient.get('/Kefu/MyVisitors', { params });
}

/**
 * 更新客服在线状态
 */
export async function postUpdateStatus(status: number) {
  return sbRequestClient.post('/Kefu/UpdateStatus', { status });
}

/**
 * 转接访客
 */
export async function postTransferVisitor(chatUserId: number, targetAgentId: number) {
  return sbRequestClient.post('/Kefu/TransferVisitor', { chatUserId, targetAgentId });
}

/**
 * 获取可转接的客服列表
 */
export async function getTransferableAgents() {
  return requestClient.get('/Kefu/TransferableAgents');
}

/**
 * 获取当前客服状态
 */
export async function getMyStatus() {
  return requestClient.get('/Kefu/MyStatus');
}

/**
 * 获取客服 IM Token
 */
export async function getAgentImToken(memberId: number, forceNew?: boolean) {
  return requestClient.get('/Auth/GetAgentToken', { params: { memberId, forceNew } });
}

/**
 * 更新访客备注
 */
export async function postUpdateRemark(id: number, nicknameRemark: string, remark: string) {
  return sbRequestClient.post('/ChatUser/UpdateRemark', { id, nicknameRemark, remark });
}

/**
 * 获取排队等待列表
 */
export async function getQueueWaitingList() {
  return requestClient.get('/Kefu/QueueWaitingList');
}

/**
 * 从排队中接入访客
 */
export async function postAcceptFromQueue(chatUserId: string) {
  return sbRequestClient.post('/Kefu/AcceptFromQueue', { chatUserId });
}
