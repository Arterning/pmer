// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

// 密码条目类型
export interface Password {
  id: number;
  title: string;
  url?: string;
  username?: string;
  password?: string;
  category?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// 命令条目类型
export interface Command {
  id: number;
  name: string;
  command_type?: string;
  command_text: string;
  created_at?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  message?: string;
  [key: string]: T;
}

// 认证响应类型
export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}
