# SBAdmin 前端开发指南

## 项目概述

基于 **Vben Admin v5.5.9** 的企业级管理后台，Vue 3 + TypeScript + Vite，支持多种 UI 框架。

## 环境要求

Node.js >=20.12.0，pnpm >=10.0.0，Git

## 项目结构

```
sb-admin/
├── apps/
│   ├── web-antd/       # Ant Design 版本（主要使用）
│   ├── web-ele/        # Element Plus 版本
│   ├── web-naive/      # Naive UI 版本
│   └── web-tdesign/    # TDesign 版本
├── packages/           # 共享包（core、hooks、components、utils）
├── scripts/            # 构建脚本
└── docs/               # 文档
```

## 快速开始

```bash
pnpm install

# 启动特定应用
pnpm run dev:antd        # http://localhost:5173
pnpm run dev:ele
pnpm run dev:naive
pnpm run dev:tdesign

# 或启动所有应用
pnpm run dev
```

## 构建和预览

```bash
pnpm build              # 构建所有应用
pnpm build:antd         # 构建特定应用
pnpm preview            # 预览
```

## API 路由约定

所有 Admin 端点遵循 `/Admin/[controller]/[action]` 模式（需要 JwtAdmin 认证）

### 认证相关（`/Admin/Auth/[action]`）
- `POST /Admin/Auth/Login` - 登录（AllowAnonymous）
- `GET /Admin/Auth/GetInfo` - 获取用户信息
- `POST /Admin/Auth/Logout` - 登出
- `POST /Admin/Auth/ChangePassword` - 修改密码
- `POST /Admin/Auth/ChangeAvatar` - 修改头像
- `GET /Admin/Auth/GetGoogleCodeInfo` - 获取谷歌验证器绑定状态
- `GET /Admin/Auth/GetGoogleCodeQR` - 获取谷歌验证器二维码
- `POST /Admin/Auth/PostBindGoogleCode` - 绑定谷歌验证器
- `POST /Admin/Auth/UnbindGoogleCode` - 解绑谷歌验证器

### 管理员管理（`/Admin/Manager/[action]`）
- `GET /Admin/Manager/List` - 管理员列表（分页）
- `GET /Admin/Manager/Detail` - 管理员详情
- `POST /Admin/Manager/Add` - 添加管理员
- `POST /Admin/Manager/Edit` - 编辑管理员
- `POST /Admin/Manager/Del` - 删除管理员

### 角色管理（`/Admin/Role/[action]`）
- `GET /Admin/Role/List` - 角色列表
- `GET /Admin/Role/Detail` - 角色详情
- `POST /Admin/Role/Add` - 添加角色
- `POST /Admin/Role/Edit` - 编辑角色
- `POST /Admin/Role/Del` - 删除角色

### 菜单管理（`/Admin/Menu/[action]`）
- `GET /Admin/Menu/All` - 获取当前用户权限菜单（树形）
- `GET /Admin/Menu/TreeList` - 树形权限菜单（分页）
- `GET /Admin/Menu/List` - 平面权限菜单（分页）
- `GET /Admin/Menu/Detail` - 菜单详情
- `POST /Admin/Menu/Add` - 添加菜单
- `POST /Admin/Menu/Edit` - 编辑菜单
- `POST /Admin/Menu/Del` - 删除菜单

### 用户管理（`/Admin/User/[action]`）
- `GET /Admin/User/List` - 用户列表（分页）
- `GET /Admin/User/Detail` - 用户详情
- `POST /Admin/User/Add` - 添加用户
- `POST /Admin/User/Edit` - 编辑用户
- `POST /Admin/User/Del` - 删除用户

### 用户记录（`/Admin/UserRecord/[action]`）
- `GET /Admin/UserRecord/List` - 用户记录列表

### 系统设置（`/Admin/SystemSetting/[action]`）
- `GET /Admin/SystemSetting/List` - 系统设置列表
- `GET /Admin/SystemSetting/GetCategoryWithSettingList` - 获取分类带设置列表
- `POST /Admin/SystemSetting/Add` - 添加设置
- `POST /Admin/SystemSetting/Edit` - 编辑设置
- `POST /Admin/SystemSetting/SaveList` - 批量保存设置
- `DELETE /Admin/SystemSetting/Del` - 删除设置

### 系统安装（`/api/Setup/[action]`，AllowAnonymous）
- `GET /api/Setup/Status` - 获取安装状态
- `POST /api/Setup/TestDatabase` - 测试数据库连接
- `POST /api/Setup/TestRedis` - 测试 Redis 连接
- `POST /api/Setup/Install` - 执行安装

### 客服工作台（`/Admin/Kefu/[action]`）
- `GET /Admin/Kefu/MyVisitors` - 获取我的访客列表（分页，支持 keyword 搜索；onlineStatus 通过 OpenIM 实时查询）
- `GET /Admin/Kefu/MyStatus` - 获取当前客服状态（onlineStatus、maxConcurrent、currentCount）
- `POST /Admin/Kefu/UpdateStatus` - 更新在线状态（0=离线, 1=在线, 2=忙碌, 3=离开）
- `GET /Admin/Kefu/TransferableAgents` - 获取可转接的客服列表
- `POST /Admin/Kefu/TransferVisitor` - 转接访客

### IM 认证（`/Admin/Auth/[action]`）
- `GET /Admin/Auth/GetAgentImToken` - 获取客服 IM Token（params: memberId）

### 访客备注（`/Admin/ChatUser/[action]`）
- `POST /Admin/ChatUser/UpdateRemark` - 更新访客备注（nicknameRemark、remark）

### 用户偏好设置（`/Admin/UserPreferences/[action]`）
- `GET /Admin/UserPreferences/Get` - 获取用户偏好设置
- `POST /Admin/UserPreferences/Save` - 保存用户偏好设置
- `GET /Admin/UserPreferences/GetSoundSettings` - 获取声音设置
- `POST /Admin/UserPreferences/SaveSoundSettings` - 保存声音设置
- `GET /Admin/UserPreferences/GetAvailableSounds` - 获取可用提示音列表

### 待审核域名（`/Admin/PendingDomain/[action]`）
- `GET /Admin/PendingDomain/List` - 待审核域名列表（分页）
- `GET /Admin/PendingDomain/ListByPlatform` - 指定平台的待审核域名
- `POST /Admin/PendingDomain/Approve` - 批准域名（加入白名单）
- `POST /Admin/PendingDomain/ApproveBatch` - 批量批准
- `POST /Admin/PendingDomain/Reject` - 拒绝域名
- `POST /Admin/PendingDomain/RejectBatch` - 批量拒绝

### 文件上传（`/Api/File/[action]`，AllowAnonymous）
- `POST /Api/File/Upload` - 文件上传（供 Widget / IM SDK 使用）

## 开发工作流

### API 调用

所有 API 定义在 `apps/web-antd/src/api/` 按模块分类：

```typescript
// apps/web-antd/src/api/core/admin.ts
export async function loginApi(data: AdminApi.LoginParams) {
  return requestClient.post<AdminApi.LoginResult>(
    '/Auth/Login',
    data,
  );
}
```

### 添加新页面

1. 在 `apps/web-antd/src/views/` 创建页面目录
2. 创建 `api.ts` 定义 API 调用
3. 创建页面组件

### OpenIM 模块

客服工作台的 IM 功能由 `src/modules/openim/` 模块提供：

```
src/modules/openim/
├── config.ts       # 单例工厂：getCore() / destroyCore()
├── useAgentIM.ts   # composable：连接管理、消息收发、模块级共享状态
└── index.ts        # barrel export
```

使用方式：
```typescript
import { useAgentIM } from '#/modules/openim';

const { isConnected, messages, login, logout, sendText } = useAgentIM();
```

**注意**：`useAgentIM()` 使用模块级 `ref`（定义在函数外），多次调用返回同一份状态，无需 Pinia。工作台 store 中统一调度 IM 连接与后端状态同步。

### 声音设置模块

用户偏好中的声音设置由 `packages/stores/src/modules/sound-settings.ts` 提供 Pinia Store，在偏好设置抽屉和 OnlineConfirmModal 中共享同一份状态。

```
关键文件：
packages/stores/src/modules/sound-settings.ts  # Pinia Store（核心）
apps/web-antd/src/api/core/user-preferences.ts  # API 接口
apps/web-antd/src/store/sound-settings.ts        # API 回调注册（副作用导入）
apps/web-antd/src/utils/notification-sound.ts    # 播放服务单例
apps/web-antd/src/utils/audio-permission.ts      # 浏览器音频权限
packages/.../blocks/user-settings/index.vue      # 偏好设置面板
packages/.../blocks/user-settings/sound-settings.vue  # 声音设置 UI
apps/web-antd/public/sounds/*.mp3                # 提示音文件
```

**数据流**：
- Store 使用回调注册模式 `registerSoundSettingsApiCallbacks()` 解耦 API 层
- `updateSettings()` 同步写 localStorage + 防抖 500ms 调 API 保存到数据库
- 登录后 `initialize()` 从服务端加载设置，localStorage 作为降级方案
- IM 消息到达时 `notificationSound.play()` 根据设置播放提示音

## 常见问题

### 问题 1：pnpm 安装失败

**症状**：`Error: ERESOLVE unable to resolve dependency tree`

**解决**：
```bash
# 清除缓存重新安装
pnpm clean --del-lock
pnpm install
```

### 问题 2：开发服务器端口被占用

**症状**：`EADDRINUSE: address already in use :::5173`

**解决**：
```bash
# 改用其他端口
pnpm run dev -- --port 5174
```

### 问题 3：API 请求 404 错误

**症状**：前端请求返回 404

**检查项**：
- 确认 API 路由地址在 `apps/web-antd/src/api/` 中的定义是否正确
- 检查后端服务是否正常运行（http://localhost:5153）
- 查看浏览器控制台的 Network 选项卡，确认请求 URL
- 确保 API 路由不包含冗余的前缀

### 问题 4：TypeScript 编译错误

**症状**：编译错误 `Type '...' is not assignable to type '...'`

**解决**：
```bash
# 运行类型检查
pnpm run check:type

# 如果有类型错误需要修复，更新相关文件的类型定义
```

### 问题 5：菜单编辑表单数据绑定问题

**症状**：编辑菜单时，icon、hideInMenu、ignoreKeepAlive 等字段无法显示

**原因**：
- 后端返回的 VbenMenu 数据结构中，这些字段被嵌套在 `meta` 对象中
- 但表单 schema 中这些字段定义在顶层
- 导致数据无法正确绑定到表单

**解决**：
在表单打开时，需要将嵌套的 `meta` 对象展平到顶层：
```typescript
const flattenedData = {
  ...data,
  title: data.meta?.title || data.title,
  icon: data.meta?.icon,
  orderNo: data.meta?.orderNo || data.orderNo,
  hideInMenu: data.meta?.hideInMenu || false,
  ignoreKeepAlive: data.meta?.ignoreKeepAlive || false,
};
formApi.setValues(flattenedData);
```

**注意**：
- 后端的 Menu 实体中这些字段是顶层属性
- 前端的 VbenMenu DTO 为了展示目的将它们放在 meta 对象中
- 编辑时需要进行展平转换以保持一致性

## 系统安装与初始化

系统首次访问时进入安装向导 (`wwwroot/setup/index.html`)。

### 安装步骤

**步骤 1：数据库配置**
- 服务器地址、端口、数据库名、用户名、密码
- 点击"测试连接"验证

**步骤 2：缓存配置** (可选)
- 启用/禁用缓存
- 选择 Provider：Memory（内存）或 Redis（分布式）
- 若选 Redis，设置连接字符串和实例前缀

**步骤 3：应用设置**
- 应用名称、CORS 策略

**步骤 4：超级管理员**
- 创建初始管理员账号

**步骤 5：确认摘要**
- 检查所有配置，点击"确认安装"

### 缓存配置

配置保存在 `appsettings.json` 的 `CacheConfig` 部分：

```json
{
  "CacheConfig": {
    "Enabled": false,
    "Provider": "Memory",
    "Redis": {
      "Connection": "localhost:6379",
      "InstanceName": "SB:"
    }
  }
}
```

**重要**：安装完成后必须重启后端应用才能加载新配置。

## 代码规范

```bash
pnpm run check         # 完整检查（lint + 类型 + 依赖）
pnpm run lint          # ESLint
pnpm run format        # 格式化代码
pnpm run check:type    # 类型检查
pnpm run commit        # 交互式提交（commitizen）
```

## 部署

```bash
pnpm run check         # 预检查
pnpm run build:antd    # 构建
# 将 dist/ 目录文件部署到 Web 服务器
```

## 调试

```bash
# 浏览器开发者工具
# F12 → Network（监控 API）
# F12 → Console（查看错误）
# 安装 Vue DevTools 浏览器扩展
```

## 性能优化

- Vite 自动处理代码分割，可在 `vite.config.ts` 中配置
- 路由懒加载：`const Page = defineAsyncComponent(() => import('@/views/...'))`
- 图片优化：使用 `vite-plugin-imagemin`

## 相关链接

- [Vben Admin](https://vben.pro/)
- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vite](https://vitejs.dev/)
