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

export interface Command {
  id: number;
  name: string;
  command_type?: string;
  command_text: string;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface AuthResponse {
  access_token?: string;
  token?: string;
  temp_token?: string;
  user?: User;
  message?: string;
  requires_2fa?: boolean;
  requires_2fa_setup?: boolean;
}

export interface PasswordsResponse {
  passwords: Password[];
}

export interface CommandsResponse {
  commands: Command[];
}

export interface TwoFactorSetupResponse {
  qr_code: string;
  secret: string;
}
