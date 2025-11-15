// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
    setup2FA: '/api/auth/setup-2fa',
    enable2FA: '/api/auth/enable-2fa',
    disable2FA: '/api/auth/disable-2fa',
    verify2FA: '/api/auth/verify-2fa',
  },
  // 密码相关
  passwords: {
    list: '/api/passwords/',
    create: '/api/passwords/',
    get: (id: number) => `/api/passwords/${id}`,
    update: (id: number) => `/api/passwords/${id}`,
    delete: (id: number) => `/api/passwords/${id}`,
    categories: '/api/passwords/categories',
  },
  // 命令相关
  commands: {
    list: '/api/commands/',
    create: '/api/commands/',
    get: (id: number) => `/api/commands/${id}`,
    update: (id: number) => `/api/commands/${id}`,
    delete: (id: number) => `/api/commands/${id}`,
    types: '/api/commands/types',
  },
};
