import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取平台列表
 */
export async function getList(params: any) {
  return requestClient.get('/ChatPlatform/List', { params });
}

/**
 * 获取平台详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/ChatPlatform/Detail', { params: { id } });
}

/**
 * 新增平台
 */
export async function postAdd(data: any) {
  return sbRequestClient.post('/ChatPlatform/Add', data);
}

/**
 * 保存平台
 */
export async function postEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/ChatPlatform/Edit', params);
  } else {
    return postAdd(params);
  }
}

/**
 * 删除平台
 */
export async function postDel(id: number) {
  return sbRequestClient.post('/ChatPlatform/Del', { id });
}

/**
 * 重置平台秘钥
 */
export async function postResetPlatformKey(id: number) {
  return sbRequestClient.post('/ChatPlatform/ResetPlatformKey', { id });
}

/**
 * 切换启用状态
 */
export async function postToggleEnabled(id: number) {
  return sbRequestClient.post('/ChatPlatform/ToggleEnabled', { id });
}

/**
 * 获取当前 Owner 的平台列表
 */
export async function getMyPlatforms() {
  return requestClient.get('/ChatPlatform/MyPlatforms');
}

/**
 * 获取所有启用的平台列表
 */
export async function getEnabledPlatforms() {
  return requestClient.get('/ChatPlatform/EnabledPlatforms');
}

/**
 * 获取站长选项列表
 */
export async function getOwnerOptions() {
  return requestClient.get('/ChatPlatform/OwnerOptions');
}

/**
 * 获取管理员选项列表
 */
export async function getAdminOptions() {
  return requestClient.get('/ChatPlatform/AdminOptions');
}

/**
 * 切换管理员接管状态
 */
export async function postToggleTakeover(id: number, adminId?: number) {
  return sbRequestClient.post('/ChatPlatform/ToggleTakeover', { id, adminId });
}

/**
 * 获取接入代码/链接
 */
export async function getAccessCode(id: number) {
  return requestClient.get('/ChatPlatform/AccessCode', { params: { id } });
}

/**
 * 获取指定平台的待审核域名
 */
export async function getPendingDomains(platformId: number) {
  return requestClient.get('/PendingDomain/ListByPlatform', {
    params: { platformId },
  });
}

/**
 * 批准待审核域名
 */
export async function postApproveDomain(id: number) {
  return sbRequestClient.post('/PendingDomain/Approve', { id });
}

/**
 * 拒绝待审核域名
 */
export async function postRejectDomain(id: number) {
  return sbRequestClient.post('/PendingDomain/Reject', { id });
}

/**
 * 批量批准待审核域名
 */
export async function postApproveDomainBatch(ids: number[]) {
  return sbRequestClient.post('/PendingDomain/ApproveBatch', { ids });
}

/**
 * 批量拒绝待审核域名
 */
export async function postRejectDomainBatch(ids: number[]) {
  return sbRequestClient.post('/PendingDomain/RejectBatch', { ids });
}
