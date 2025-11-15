import { apiClient } from './client';
import { API_ENDPOINTS } from '../utils/config';
import type { Password } from '../types';

export const passwordsApi = {
  async getAll(): Promise<{ passwords: Password[] }> {
    return apiClient.get(API_ENDPOINTS.passwords.list);
  },

  async getById(id: number): Promise<Password> {
    return apiClient.get(API_ENDPOINTS.passwords.get(id));
  },

  async create(data: {
    title: string;
    url?: string;
    username?: string;
    password: string;
    category?: string;
    notes?: string;
  }): Promise<{ message: string; password: Password }> {
    return apiClient.post(API_ENDPOINTS.passwords.create, data);
  },

  async update(
    id: number,
    data: {
      title?: string;
      url?: string;
      username?: string;
      password?: string;
      category?: string;
      notes?: string;
    }
  ): Promise<{ message: string; password: Password }> {
    return apiClient.put(API_ENDPOINTS.passwords.update(id), data);
  },

  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete(API_ENDPOINTS.passwords.delete(id));
  },

  async getCategories(): Promise<{ categories: string[] }> {
    return apiClient.get(API_ENDPOINTS.passwords.categories);
  },
};
