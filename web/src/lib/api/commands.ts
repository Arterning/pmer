import { apiClient } from './client';
import { API_ENDPOINTS } from '../utils/config';
import type { Command } from '../types';

export const commandsApi = {
  async getAll(): Promise<{ commands: Command[] }> {
    return apiClient.get(API_ENDPOINTS.commands.list);
  },

  async getById(id: number): Promise<Command> {
    return apiClient.get(API_ENDPOINTS.commands.get(id));
  },

  async create(data: {
    name: string;
    command_type?: string;
    command_text: string;
  }): Promise<{ message: string; command: Command }> {
    return apiClient.post(API_ENDPOINTS.commands.create, data);
  },

  async update(
    id: number,
    data: {
      name?: string;
      command_type?: string;
      command_text?: string;
    }
  ): Promise<{ message: string; command: Command }> {
    return apiClient.put(API_ENDPOINTS.commands.update(id), data);
  },

  async delete(id: number): Promise<{ message: string }> {
    return apiClient.delete(API_ENDPOINTS.commands.delete(id));
  },

  async getTypes(): Promise<{ types: string[] }> {
    return apiClient.get(API_ENDPOINTS.commands.types);
  },
};
