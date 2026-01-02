// types/auth.ts
export interface User {
  token: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string, token: string) => Promise<void>;
}

export interface DecodedToken {
  email: string;
  userName: string;
  roles: string[];
  tenantId: number;
  exp: number;
  iat: number;
}