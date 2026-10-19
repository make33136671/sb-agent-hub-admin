import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取系统设置列表
 */
export async function getList(params: any) {
  return requestClient.get('/SystemSetting/List', {
    params,
  });
}

/**
 * 获取分类及其设置项列表
 */
export async function getCategoryWithSettingList() {
  return requestClient.get('/SystemSetting/GetCategoryWithSettingList');
}

/**
 * 获取单个系统设置详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/SystemSetting/Detail', {
    params: { id },
  });
}

/**
 * 新增系统设置
 */
export async function postAdd(data: any) {
  return sbRequestClient.post('/SystemSetting/Add', data);
}

/**
 * 编辑系统设置
 */
export async function postEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/SystemSetting/Edit', params);
  } else {
    return postAdd(params);
  }
}

/**
 * 批量保存系统设置
 */
export async function postSaveList(data: any[]) {
  return sbRequestClient.post('/SystemSetting/SaveList', {
    settings: JSON.stringify(data),
  });
}

/**
 * 删除系统设置
 */
export async function postDel(id: any) {
  return sbRequestClient.delete(`/SystemSetting/Del`, {
    params: { id },
  });
}

// ========== 系统设置分类 ==========

/**
 * 获取设置分类列表
 */
export async function getCategoryList(params: any) {
  return requestClient.get('/SystemSettingCategory/List', {
    params,
  });
}

/**
 * 获取单个设置分类详情
 */
export async function getCategoryDetail(id: number) {
  return requestClient.get('/SystemSettingCategory/Detail', {
    params: { id },
  });
}

/**
 * 新增设置分类
 */
export async function postCategoryAdd(data: any) {
  return sbRequestClient.post('/SystemSettingCategory/Add', data);
}

/**
 * 编辑设置分类
 */
export async function postCategoryEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/SystemSettingCategory/Edit', params);
  } else {
    return postCategoryAdd(params);
  }
}

/**
 * 删除设置分类
 */
export async function postCategoryDel(id: any) {
  return sbRequestClient.post('/SystemSettingCategory/Del', { id });
}

/**
 * 查询系统设置
 */
export async function querySystemSetting(key: string) {
  return requestClient.get('/SystemSetting/QuerySystemSetting', {
    params: { key },
  });
}

/**
 * 查询设置分类
 */
export async function queryCategoryList(key: string) {
  return requestClient.get(
    '/SystemSettingCategory/QuerySystemSettingCategory',
    {
      params: { key },
    },
  );
}
