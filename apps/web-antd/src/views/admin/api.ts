import { requestClient, sbRequestClient } from '#/api/request';

/**
 * 获取管理员列表
 */
export async function getList(params: any) {
  return requestClient.get('/Manager/List', {
    params: params,
  });
}

/**
 * 获取单个管理员详情
 */
export async function getDetail(id: number) {
  return requestClient.get('/Manager/Detail', {
    params: { id },
  });
}

/**
 * 新增单个管理员
 */
export async function postAdd(data: any) {
  return sbRequestClient.post('/Manager/Add', data);
}

/**
 * 保存单个管理员详情
 */
export async function postEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/Manager/Edit', params);
  } else {
    return postAdd(params);
  }
}

/**
 * 删除管理员
 */
export async function postDel(id: any) {
  return sbRequestClient.post('/Manager/Del', {
    id,
  });
}

/**
 * 获取角色列表
 */
export async function getRoleList(params: any) {
  return requestClient.get('/Manager/RoleList', {
    params: params,
  });
}

/**
 * 获取角色详情
 */
export async function getRoleDetail(id: number) {
  return requestClient.get('/Manager/RoleDetail', {
    params: { id },
  });
}

/**
 * 新增角色
 */
export async function postRoleAdd(data: any) {
  return sbRequestClient.post('/Manager/RoleAdd', data);
}

/**
 * 保存角色详情
 */
export async function postRoleEdit(params: any) {
  if (params.id) {
    return sbRequestClient.post('/Manager/RoleEdit', params);
  } else {
    return postRoleAdd(params);
  }
}

/**
 * 删除角色
 */
export async function postRoleDel(id: any) {
  return sbRequestClient.post('/Manager/RoleDel', {
    id,
  });
}

/**
 * 获取可作为上级的管理员列表(用于选择ParentId)
 */
export async function getParentList() {
  return requestClient.get('/Manager/List', {
    params: {
      page: 1,
      pageSize: 1000,
    },
  });
}

/**
 * 获取所有菜单树形列表
 */
export async function getAllMenuTree() {
  return requestClient.get('/Menu/TreeList', {
    params: {
      page: 1,
      pageSize: 1000,
    },
  });
}

/**
 * 获取角色已授权的菜单ID列表
 */
export async function getRoleMenuIds(roleId: number) {
  return requestClient.get('/Manager/GetMenuIds', {
    params: { roleId },
  });
}

/**
 * 设置角色菜单权限
 */
export async function setRoleMenus(roleId: number, menuIds: number[]) {
  return sbRequestClient.post('/Manager/SetMenus', {
    roleId,
    menuIds: menuIds.join(','),
  });
}

/**
 * 获取角色的菜单详情
 */
export async function getRoleMenusDetail(roleId: number) {
  return requestClient.get('/Manager/GetMenusDetail', {
    params: { roleId },
  });
}

/**
 * 为角色添加单个菜单权限
 */
export async function addRoleMenu(roleId: number, menuId: number) {
  return sbRequestClient.post('/Manager/AddMenu', {
    roleId,
    menuId,
  });
}

/**
 * 移除角色的单个菜单权限
 */
export async function removeRoleMenu(roleId: number, menuId: number) {
  return sbRequestClient.post('/Manager/RemoveMenu', {
    roleId,
    menuId,
  });
}

/**
 * 复制角色菜单权限
 */
export async function copyRoleMenus(fromRoleId: number, toRoleId: number) {
  return sbRequestClient.post('/Manager/CopyMenus', {
    fromRoleId,
    toRoleId,
  });
}

/**
 * 获取拥有指定菜单的角色列表
 */
export async function getRolesByMenu(menuId: number) {
  return requestClient.get('/Manager/GetRolesByMenu', {
    params: { menuId },
  });
}

/**
 * 查询角色
 */
export async function queryAdminRole(key: string) {
  return requestClient.get('/Manager/QueryAdminRole', {
    params: { key },
  });
}
