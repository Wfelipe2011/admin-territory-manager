// types/auth.ts
export interface User {
  token: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface DecodedToken {
  email: string;
  userName: string;
  roles: string[];
  tenantId: number;
}