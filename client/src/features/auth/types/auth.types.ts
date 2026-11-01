export interface User {
  id: string;
  username: string;
  status: 'ACTIVE' | 'INACTIVE';
  lastLoginAt?: string;
}

export interface Partner {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthSessionData {
  token: string;
  user: User;
  partner: Partner;
}

export interface AuthContextType {
  user: User | null;
  partner: Partner | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}
