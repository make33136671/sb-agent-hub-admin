import type { Directive, DirectiveBinding } from 'vue';

import { useUserStore } from '@vben/stores';

import type { UserType } from '#/types/admin';
import { PermissionUtil } from '#/utils/permission';

/**
 * 权限指令
 * 用法: v-permission="'admin:add'"
 * 当用户无权限时,元素会被移除
 */
export const permissionDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string>) {
    const { value } = binding;
    if (!value) return;

    const userStore = useUserStore();
    const roles = userStore.userInfo?.roles ?? [];

    const userType: UserType = roles.includes('admin') ? 'Admin' : 'Member';
    const role = roles.includes('Owner')
      ? 'Owner'
      : roles.includes('Agent')
        ? 'Agent'
        : undefined;

    const hasPermission = PermissionUtil.hasActionPermission(
      userType,
      role,
      value,
    );

    if (!hasPermission) {
      el.parentNode?.removeChild(el);
    }
  },
};

/**
 * 注册权限指令到 Vue 应用
 */
export function setupPermissionDirective(app: any) {
  app.directive('permission', permissionDirective);
}
