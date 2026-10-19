import type { UserType, MemberRole } from '#/types/admin';

/**
 * 权限工具类
 * 菜单权限由后端控制（accessMode: 'backend'），此处仅做按钮级操作权限判断
 */
export class PermissionUtil {
  /**
   * 检查用户是否有执行指定操作的权限
   */
  static hasActionPermission(
    userType: UserType,
    role: string | undefined,
    action: string,
  ): boolean {
    // Admin 拥有所有权限
    if (userType === 'Admin') {
      return true;
    }

    // Member 根据角色判断
    const memberRole = role as MemberRole | undefined;

    const actionPermissions: Record<string, MemberRole[]> = {
      // 管理员管理（仅 Admin 可操作，Member 无权限）
      'admin:add': [],
      'admin:edit': [],
      'admin:delete': [],
      'admin:resetPassword': [],

      // 客服管理
      'agent:add': ['Owner'],
      'agent:edit': ['Owner'],
      'agent:delete': ['Owner'],
      'agent:resetPassword': ['Owner'],
      'agent:toggleStatus': ['Owner'],

      // 平台管理
      'platform:add': ['Owner'],
      'platform:edit': ['Owner'],
      'platform:delete': ['Owner'],
      'platform:toggleEnabled': ['Owner'],
      'platform:resetKey': ['Owner'],

      // 聊天用户
      'chatuser:view': ['Owner', 'Agent'],
      'chatuser:edit': ['Owner'],
      'chatuser:delete': ['Owner'],
      'chatuser:remark': ['Owner', 'Agent'],
      'chatuser:blacklist': ['Owner'],

      // 配置管理
      'config:edit': ['Owner'],

      // 工作台
      'workbench:transfer': ['Owner', 'Agent'],
      'workbench:updateStatus': ['Owner', 'Agent'],
    };

    const allowedRoles = actionPermissions[action];
    if (!allowedRoles) return false;
    if (!memberRole) return false;
    return allowedRoles.includes(memberRole);
  }

  /**
   * 获取数据范围
   */
  static getDataScope(
    userType: UserType,
  ): 'all' | 'owned' | 'self' {
    if (userType === 'Admin') return 'all';
    return 'owned';
  }
}
