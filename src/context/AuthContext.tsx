"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { parseCookies, setCookie, destroyCookie } from "nookies";
import { AuthContextType, User } from "@/types/auth";
import { URL_API } from "@/infra/AxiosAdapter";
import { cookies } from "next/headers";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const { token } = parseCookies();
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${URL_API}/v1/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (response.ok) {
      setCookie(null, "token", data.token, {
        maxAge: 60 * 60 * 24, // 1 dia
        path: "/",
      });
      setUser({ token: data.token });
      router.push("/dashboard");
    } else {
      alert("Login falhou!");
    }
  };

  const logout = async () => {
    destroyCookie(null, "token");
    setUser(null);
    const cookieStore = await cookies();
    cookieStore.delete("token");
    router.push("/login");
  };

  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
