// API配置
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const API_ENDPOINTS = {
  // 认证相关
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    profile: '/api/auth/profile',
    changePassword: '/api/auth/change-password',
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
