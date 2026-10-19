import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';
import { useUserStore } from '@vben/stores';

import { defineComponent, h } from 'vue';

import { message } from 'ant-design-vue';
import { RouterView } from 'vue-router';

import { getAllMenusApi } from '#/api';
import { BasicLayout, IFrameView } from '#/layouts';
import { $t } from '#/locales';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

const ParentLayout = defineComponent({
  name: 'ParentLayout',
  render() {
    return h(RouterView);
  },
});

/**
 * 递归过滤站长管理菜单（Member 用户不可见）
 * 排除 name 为 MemberMgmt / OwnerList 或 path 为 /member-mgmt/owner 的节点
 */
function filterOwnerMenus(menus: any[]): any[] {
  return menus
    .filter((m) => {
      if (m.name === 'MemberMgmt' || m.name === 'OwnerList') return false;
      if (m.path === '/member-mgmt/owner') return false;
      return true;
    })
    .map((m) => ({
      ...m,
      children: m.children ? filterOwnerMenus(m.children) : m.children,
    }));
}

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
    LAYOUT: BasicLayout,
    PARENT: ParentLayout,
  };

  return await generateAccessible(preferences.app.accessMode, {
    ...options,
    fetchMenuListAsync: async () => {
      message.loading({
        content: `${$t('common.loadingMenu')}...`,
        duration: 1.5,
      });
      const menus = await getAllMenusApi();

      // 站长/客服登录时隐藏站长管理菜单
      const userStore = useUserStore();
      const roles = userStore.userInfo?.roles ?? [];
      const isMember = !roles.includes('admin');

      if (isMember) {
        return filterOwnerMenus(menus);
      }

      return menus;
    },
    // 可以指定没有权限跳转403页面
    forbiddenComponent,
    // 如果 route.meta.menuVisibleWithForbidden = true
    layoutMap,
    pageMap,
  });
}

export { generateAccess };
