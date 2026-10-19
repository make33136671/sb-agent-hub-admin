import type { UserInfo } from '@vben/types';

import {
  baseRequestClient,
  requestClient,
  sbRequestClient,
} from '#/api/request';

export namespace AdminApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
    userInfo?: UserInfo;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 修改密码接口参数 */
  export interface ChangePasswordParams {
    oldPassword?: string;
    newPassword?: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AdminApi.LoginParams) {
  return requestClient.post<AdminApi.LoginResult>('/Auth/Login', data);
}

/**
 * 获取用户信息
 */
export async function getAdminInfoApi() {
  return requestClient.get<UserInfo>('/Auth/GetInfo');
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AdminApi.RefreshTokenResult>(
    '/Auth/Login',
    {
      withCredentials: true,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/Auth/Logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: {
  oldPassword: string;
  newPassword: string;
}) {
  return sbRequestClient.post('/Auth/ChangePassword', data);
}

/**
 * 修改头像
 */
export async function changeAvatarApi(avatar: string) {
  return sbRequestClient.post('/Auth/ChangeAvatar', { avatar });
}

/**
 * 修改个人资料
 */
export async function updateProfileApi(data: { name: string }) {
  return requestClient.post('/Auth/UpdateProfile', data);
}

/**
 * 上传文件
 */
export async function uploadFileApi(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return requestClient.post('/Auth/Upload', formData);
}

/**
 * 获取谷歌验证器二维码
 */
export async function getGoogleCodeQRApi() {
  return sbRequestClient.get('/Auth/GetGoogleCodeQR');
}

/**
 * 获取谷歌验证器绑定信息
 */
export async function getGoogleCodeInfoApi() {
  return sbRequestClient.get('/Auth/GetGoogleCodeInfo');
}

/**
 * 绑定谷歌验证器
 */
export async function bindGoogleCodeApi(totpCode: string, password: string) {
  return sbRequestClient.post('/Auth/BindGoogleCode', { totpCode, password });
}

/**
 * 解绑谷歌验证器
 */
export async function unbindGoogleCodeApi(totpCode: string, password: string) {
  return sbRequestClient.post('/Auth/UnbindGoogleCode', { totpCode, password });
}
