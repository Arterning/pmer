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
};
