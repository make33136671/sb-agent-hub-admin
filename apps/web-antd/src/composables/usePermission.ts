import { computed } from 'vue';

import { useUserStore } from '@vben/stores';

import type { UserType } from '#/types/admin';
import { PermissionUtil } from '#/utils/permission';

/**
 * 权限控制组合式函数
 */
export function usePermission() {
  const userStore = useUserStore();

  const userType = computed<UserType>(() => {
    const roles = userStore.userInfo?.roles ?? [];
    // roles 中包含 'admin' 表示 Admin，否则为 Member
    if (roles.includes('admin')) return 'Admin';
    return 'Member';
  });

  const role = computed<string | undefined>(() => {
    const roles = userStore.userInfo?.roles ?? [];
    if (roles.includes('Owner')) return 'Owner';
    if (roles.includes('Agent')) return 'Agent';
    return undefined;
  });

  /**
   * 检查是否有操作权限
   */
  const hasPermission = (action: string): boolean => {
    return PermissionUtil.hasActionPermission(
      userType.value,
      role.value,
      action,
    );
  };

  /**
   * 检查是否有任意一个权限
   */
  const hasAnyPermission = (actions: string[]): boolean => {
    return actions.some((action) => hasPermission(action));
  };

  /**
   * 检查是否有所有权限
   */
  const hasAllPermissions = (actions: string[]): boolean => {
    return actions.every((action) => hasPermission(action));
  };

  /**
   * 数据范围
   */
  const dataScope = computed(() => {
    return PermissionUtil.getDataScope(userType.value);
  });

  /**
   * 是否是系统管理员
   */
  const isAdmin = computed(() => userType.value === 'Admin');

  /**
   * 是否是站长
   */
  const isOwner = computed(() => role.value === 'Owner');

  /**
   * 是否是客服
   */
  const isAgent = computed(() => role.value === 'Agent');

  return {
    userType,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    dataScope,
    isAdmin,
    isOwner,
    isAgent,
  };
}
