/**
 * 用户类型（与后端 JWT Claims 中的 UserType 对应）
 * Admin = 系统管理员
 * Member = 业务用户（Owner 站长 / Agent 客服）
 */
export type UserType = 'Admin' | 'Member';

/**
 * Member 角色（与后端 MemberRole 枚举对应）
 */
export type MemberRole = 'Agent' | 'Owner';
