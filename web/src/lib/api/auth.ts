import { apiClient } from './client';
import { API_ENDPOINTS } from '../utils/config';
import type { AuthResponse, User } from '../types';

export const authApi = {
  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    return apiClient.post(API_ENDPOINTS.auth.register, {
      username,
      email,
      password,
    });
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    return apiClient.post(API_ENDPOINTS.auth.login, {
      username,
      password,
    });
  },

  async getProfile(): Promise<{ user: User }> {
    return apiClient.get(API_ENDPOINTS.auth.profile);
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<{ message: string }> {
    return apiClient.put(API_ENDPOINTS.auth.changePassword, {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },

  async setup2FA(): Promise<{ message: string; secret: string; qr_code: string; uri: string }> {
    return apiClient.post(API_ENDPOINTS.auth.setup2FA);
  },

  async enable2FA(code: string, password?: string): Promise<{ message: string; token?: string; user?: User; auto_login?: boolean }> {
    return apiClient.post(API_ENDPOINTS.auth.enable2FA, { code, password });
  },

  async disable2FA(code: string): Promise<{ message: string }> {
    return apiClient.post(API_ENDPOINTS.auth.disable2FA, { code });
  },

  async verify2FA(tempToken: string, code: string): Promise<AuthResponse> {
    return apiClient.post(API_ENDPOINTS.auth.verify2FA, {
      temp_token: tempToken,
      code,
    });
  },
};
